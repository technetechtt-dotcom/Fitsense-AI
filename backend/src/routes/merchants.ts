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
  listInventory,
  listMembers,
  listOrgsForDevice,
  listOutcomes,
  eraseOutcomesByDevice,
  listProducts,
  pilotMetrics,
  pilotRoi,
  outcomeFitInsights,
  getBilling,
  upsertBilling,
  listIntegrations,
  upsertIntegration,
  recordOutcome,
  revokeApiKey,
  upsertBrandFitProfile,
  upsertInventory,
  upsertMember,
} from "../services/merchantStore.js";
import { issueCatalogueToken } from "../services/sessionAuth.js";
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
        step: z.number().positive().default(1),
      })
      .refine((r) => r.min < r.max, { message: "sizeRangeEu.min must be < max" }),
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
        /** Fitting width (e.g. standard, wide, D, EE). Defaults to standard. */
        widthLabel: z.string().trim().min(1).max(32).optional(),
        /** Store or warehouse location id (default = org-wide). */
        locationId: z.string().trim().min(1).max(80).optional(),
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
  /** Retail / POS order id — stored in outcome `data.orderId` for attribution. */
  orderId: z.string().trim().min(1).max(120).optional(),
  /** Stable commercial order-line id (shared by purchase/return/exchange). */
  orderLineId: z.string().trim().min(1).max(160).optional(),
  /** Pilot arm: FitSense-assisted vs control (no FitSense size). */
  cohort: z.enum(["assisted", "control"]).optional(),
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

/** Mint a short-lived catalogue/inventory read token (device or API key only). */
merchantRouter.post(
  "/merchants/orgs/:orgId/catalogue-token",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      if (req.authVia === "catalogue_token") {
        res.status(403).json({ error: "catalogue_token_cannot_mint" });
        return;
      }
      const issued = issueCatalogueToken(req.orgId!, {
        uid: req.uid,
        ttlMs: config.catalogueTokenTtlMs,
      });
      res.status(201).json({
        token: issued.token,
        exp: issued.exp,
        scope: "merchant:catalogue:read",
        orgId: req.orgId,
      });
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

merchantRouter.get(
  "/merchants/orgs/:orgId/inventory",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const locationId =
        typeof req.query.locationId === "string" ? req.query.locationId : undefined;
      res.json({ items: await listInventory(req.orgId!, locationId) });
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
      const { orderId, orderLineId, cohort, data: rawData, ...rest } = body;
      const data: Record<string, unknown> = { ...(rawData ?? {}) };
      // Never trust client-supplied actor device attribution.
      delete data.deviceId;
      if (orderId) data.orderId = orderId;
      if (orderLineId) data.orderLineId = orderLineId;
      if (cohort) data.cohort = cohort;
      if (req.authVia === "device" && req.uid) {
        data.deviceId = req.uid;
      } else if (req.authVia === "api_key") {
        data.authVia = "api_key";
        if (req.apiKeyId) data.apiKeyId = req.apiKeyId;
      }
      const idempotencyKey = req.header("idempotency-key")?.trim() || undefined;
      // Commercial line id (shared across purchase/return/exchange for that SKU line).
      // Do NOT embed kind — event uniqueness is (order_line_id, kind) + Idempotency-Key.
      const commercialLine =
        orderLineId ??
        (orderId && rest.productId && rest.sizeLabel
          ? `${orderId}|${rest.productId}|${rest.sizeSystem ?? ""}|${rest.sizeLabel}`
          : undefined);
      const result = await recordOutcome({
        orgId: req.orgId!,
        ...rest,
        cohort,
        data: Object.keys(data).length ? data : undefined,
        orderLineId: commercialLine,
        idempotencyKey,
      });
      res.status(result.reused ? 200 : 201).json({
        outcomeId: result.outcomeId,
        reused: result.reused,
      });
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.get(
  "/merchants/orgs/:orgId/outcomes",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const since = req.query.sinceEpochMs ? Number(req.query.sinceEpochMs) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const orderId =
        typeof req.query.orderId === "string" ? req.query.orderId : undefined;
      const deviceId =
        typeof req.query.deviceId === "string" ? req.query.deviceId : undefined;
      const rows = await listOutcomes(req.orgId!, {
        sinceEpochMs: since,
        limit,
        orderId,
        deviceId,
      });
      const format = String(req.query.format ?? "json").toLowerCase();
      if (format === "csv") {
        const header =
          "outcomeId,kind,productId,brand,sizeSystem,sizeLabel,orderId,reason,createdAtEpochMs";
        const escape = (v: string | null | undefined) => {
          const s = v ?? "";
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = rows.map((r) =>
          [
            r.outcomeId,
            r.kind,
            escape(r.productId),
            escape(r.brand),
            escape(r.sizeSystem),
            escape(r.sizeLabel),
            escape(r.orderId),
            escape(r.reason),
            String(r.createdAtEpochMs),
          ].join(","),
        );
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="outcomes-${req.orgId}.csv"`,
        );
        res.send([header, ...lines].join("\n"));
        return;
      }
      res.json({ outcomes: rows });
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.delete(
  "/merchants/orgs/:orgId/outcomes",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const deviceId =
        typeof req.query.deviceId === "string" ? req.query.deviceId.trim() : "";
      if (!deviceId) {
        res.status(400).json({ error: "deviceId query required" });
        return;
      }
      const result = await eraseOutcomesByDevice(req.orgId!, deviceId);
      res.json(result);
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

merchantRouter.get(
  "/merchants/orgs/:orgId/pilot-roi",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const since = req.query.sinceEpochMs ? Number(req.query.sinceEpochMs) : undefined;
      const avgMarginZar = req.query.avgMarginZar
        ? Number(req.query.avgMarginZar)
        : undefined;
      const avgReturnCostZar = req.query.avgReturnCostZar
        ? Number(req.query.avgReturnCostZar)
        : undefined;
      res.json(
        await pilotRoi(req.orgId!, {
          sinceEpochMs: since,
          avgMarginZar,
          avgReturnCostZar,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.get(
  "/merchants/orgs/:orgId/outcome-fit-insights",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const since = req.query.sinceEpochMs ? Number(req.query.sinceEpochMs) : undefined;
      res.json(await outcomeFitInsights(req.orgId!, since));
    } catch (err) {
      next(err);
    }
  },
);

const billingSchema = z.object({
  plan: z.enum(["pilot", "starter", "growth", "enterprise"]).optional(),
  status: z.enum(["trialing", "active", "past_due", "cancelled"]).optional(),
  billingEmail: z.string().email().optional(),
  region: z.string().trim().max(80).optional(),
  onboardingStep: z
    .enum([
      "org_created",
      "catalogue_loaded",
      "inventory_loaded",
      "popia_signed",
      "pos_integrated",
      "live",
    ])
    .optional(),
  data: z.record(z.unknown()).optional(),
});

merchantRouter.get(
  "/merchants/orgs/:orgId/billing",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json(await getBilling(req.orgId!));
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.put(
  "/merchants/orgs/:orgId/billing",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = billingSchema.parse(req.body);
      res.json(await upsertBilling(req.orgId!, body));
    } catch (err) {
      next(err);
    }
  },
);

const integrationSchema = z.object({
  provider: z.enum(["pos", "ecommerce", "erp", "catalogue_feed"]),
  status: z.enum(["pending", "connected", "error"]).default("pending"),
  externalRef: z.string().trim().max(160).optional(),
  data: z.record(z.unknown()).optional(),
});

merchantRouter.get(
  "/merchants/orgs/:orgId/integrations",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ integrations: await listIntegrations(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

merchantRouter.put(
  "/merchants/orgs/:orgId/integrations",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = integrationSchema.parse(req.body);
      res.json(await upsertIntegration(req.orgId!, body));
    } catch (err) {
      next(err);
    }
  },
);
