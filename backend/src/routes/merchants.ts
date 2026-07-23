import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { requireOrgRole, type MerchantRequest } from "../middleware/merchantAuth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  createApiKey,
  createOrg,
  ingestProducts,
  listApiKeys,
  listBrandFitProfiles,
  listMembers,
  listOrgsForDevice,
  listProducts,
  pilotMetrics,
  recordOutcome,
  revokeApiKey,
  upsertBrandFitProfile,
  upsertInventory,
  upsertMember,
} from "../services/merchantStore.js";
import { documentIdSchema } from "../validation/schemas.js";

export const merchantRouter = Router();

merchantRouter.use(
  rateLimit({
    name: "merchants",
    max: config.rateLimit.syncMax,
    key: (req) => `ip:${req.ip}`,
  }),
);

const createOrgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  region: z.string().trim().min(2).max(80).optional(),
});

const memberSchema = z.object({
  deviceId: documentIdSchema,
  role: z.enum(["owner", "admin", "operator", "viewer"]),
});

const productSchema = z
  .object({
    productId: documentIdSchema,
    brand: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(40),
    fitType: z.enum(["narrow", "standard", "wide", "extra_wide"]).or(z.string()),
    sizeRangeEu: z
      .object({
        min: z.number(),
        max: z.number(),
        step: z.number().positive(),
      })
      .optional(),
    priceUsd: z.number().nonnegative().optional(),
    description: z.string().max(2000).optional(),
    colorways: z.array(z.string()).max(50).optional(),
    storeUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    dataQuality: z.enum(["verified", "unverified"]).optional(),
    sku: z.string().trim().max(80).optional(),
  })
  .passthrough();

const ingestSchema = z.object({
  products: z.array(productSchema).min(1).max(200),
});

const inventorySchema = z.object({
  items: z
    .array(
      z.object({
        productId: documentIdSchema,
        sizeSystem: z.enum(["uk", "us", "eu", "mondopoint"]),
        sizeLabel: z.string().trim().min(1).max(32),
        quantity: z.number().int().nonnegative(),
      }),
    )
    .min(1)
    .max(500),
});

const brandFitSchema = z.object({
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().max(120).optional(),
  euSizeDelta: z.number().min(-2).max(2),
  toeBoxWidth: z.enum(["narrow", "regular", "wide", "extra_wide"]),
  midsoleFeel: z.enum(["firm", "balanced", "soft", "unknown"]),
  note: z.string().trim().max(500).optional(),
});

const outcomeSchema = z.object({
  kind: z.enum(["purchase", "return", "exchange"]),
  productId: documentIdSchema.optional(),
  brand: z.string().trim().max(80).optional(),
  sizeLabel: z.string().trim().max(32).optional(),
  sizeSystem: z.enum(["uk", "us", "eu", "mondopoint"]).optional(),
  fitId: documentIdSchema.optional(),
  reason: z.string().trim().max(80).optional(),
  data: z.record(z.unknown()).optional(),
});

/** Create a merchant organisation; caller becomes owner. */
merchantRouter.post(
  "/merchants/orgs",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const body = createOrgSchema.parse(req.body);
      const org = await createOrg({
        name: body.name,
        region: body.region,
        ownerDeviceId: req.uid,
      });
      res.status(201).json(org);
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.get(
  "/merchants/orgs",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      res.json({ orgs: await listOrgsForDevice(req.uid) });
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.get(
  "/merchants/orgs/:orgId/members",
  requireAuth,
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ members: await listMembers(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.put(
  "/merchants/orgs/:orgId/members",
  requireAuth,
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = memberSchema.parse(req.body);
      await upsertMember({
        orgId: req.orgId!,
        deviceId: body.deviceId,
        role: body.role,
      });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.post(
  "/merchants/orgs/:orgId/api-keys",
  requireAuth,
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const label = z
        .object({ label: z.string().trim().min(1).max(80).default("default") })
        .parse(req.body ?? {}).label;
      const issued = await createApiKey({ orgId: req.orgId!, label });
      res.status(201).json(issued);
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.get(
  "/merchants/orgs/:orgId/api-keys",
  requireAuth,
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ keys: await listApiKeys(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.post(
  "/merchants/orgs/:orgId/api-keys/:keyId/revoke",
  requireAuth,
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const keyId = String(req.params.keyId ?? "").trim();
      const ok = await revokeApiKey({ orgId: req.orgId!, keyId });
      if (!ok) {
        res.status(404).json({ error: "api_key_not_found" });
        return;
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.post(
  "/merchants/orgs/:orgId/catalogue/ingest",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = ingestSchema.parse(req.body);
      const result = await ingestProducts(req.orgId!, body.products);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.get(
  "/merchants/orgs/:orgId/catalogue",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ products: await listProducts(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.put(
  "/merchants/orgs/:orgId/inventory",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = inventorySchema.parse(req.body);
      const result = await upsertInventory(req.orgId!, body.items);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.put(
  "/merchants/orgs/:orgId/brand-fit",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = brandFitSchema.parse(req.body);
      await upsertBrandFitProfile({ orgId: req.orgId!, ...body });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.get(
  "/merchants/orgs/:orgId/brand-fit",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ profiles: await listBrandFitProfiles(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.post(
  "/merchants/orgs/:orgId/outcomes",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = outcomeSchema.parse(req.body);
      const result = await recordOutcome({ orgId: req.orgId!, ...body });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.get(
  "/merchants/orgs/:orgId/pilot-metrics",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const since = req.query.sinceEpochMs ? Number(req.query.sinceEpochMs) : undefined;
      res.json(await pilotMetrics(req.orgId!, since));
    } catch (err) {
      next(err);
    }
  },
);
