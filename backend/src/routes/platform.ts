import { randomBytes } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { requireOrgRole, type MerchantRequest } from "../middleware/merchantAuth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { verifyAuditChain } from "../services/auditLog.js";
import {
  advanceOnboarding,
  checkEntitlement,
  createSupportTicket,
  escalateTicket,
  generateInvoice,
  listInvoices,
  listTickets,
  reconcilePayment,
  recordUsage,
  resolveTicket,
  slaReport,
  upsertCertification,
  upsertPilotContract,
  usageSummary,
} from "../services/commercial.js";
import {
  createBreachIncident,
  createDsarRequest,
  listBreachIncidents,
  listDsarRequests,
  listProcessingRegister,
  updateBreachIncident,
  updateDsarStatus,
  upsertOperatorAgreement,
  verifyRetentionJob,
} from "../services/compliance.js";
import {
  acceptInvitation,
  createInvitation,
  createReturn,
  ingestOrder,
  listIntegrationHealth,
  listInvitations,
  listLocations,
  listOrders,
  listPrices,
  listPromotions,
  listReturns,
  parseCsvTable,
  recordCredentialRotation,
  recordIntegrationCheck,
  runReconciliation,
  storeAnalytics,
  upsertLocation,
  upsertPrices,
  upsertPromotion,
} from "../services/platformRetail.js";
import { upsertInventory, ingestProducts } from "../services/merchantStore.js";
import {
  createWebhookEndpoint,
  enqueueWebhookEvent,
  listWebhookDeliveries,
  listWebhookEndpoints,
  processWebhookDeliveries,
  retryDeadLetter,
} from "../services/webhooks.js";
import { documentIdSchema } from "../validation/schemas.js";

export const platformRouter = Router();

platformRouter.use(
  rateLimit({
    name: "platform",
    max: config.rateLimit.syncMax,
    key: (req) => `ip:${req.ip}`,
  }),
);

// ---- Locations ----
platformRouter.put(
  "/merchants/orgs/:orgId/locations",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          locationId: z.string().trim().min(1).max(80).optional(),
          code: z.string().trim().min(1).max(40),
          name: z.string().trim().min(1).max(120),
          kind: z.enum(["store", "warehouse", "region"]),
          region: z.string().trim().max(80).optional(),
          parentLocationId: z.string().trim().max(80).optional(),
          timezone: z.string().trim().max(60).optional(),
        })
        .parse(req.body);
      const result = await upsertLocation({
        orgId: req.orgId!,
        ...body,
        actorId: req.uid,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/locations",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ locations: await listLocations(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/analytics/stores",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const region =
        typeof req.query.region === "string" ? req.query.region : undefined;
      res.json(await storeAnalytics(req.orgId!, region));
    } catch (err) {
      next(err);
    }
  },
);

// ---- Prices & promotions ----
platformRouter.put(
  "/merchants/orgs/:orgId/prices",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          items: z
            .array(
              z.object({
                productId: documentIdSchema,
                currency: z.string().trim().length(3).optional(),
                amountCents: z.number().int().nonnegative(),
                locationId: z.string().trim().max(80).optional(),
                effectiveFrom: z.string().datetime().optional(),
                effectiveTo: z.string().datetime().optional(),
              }),
            )
            .min(1)
            .max(500),
        })
        .parse(req.body);
      res.json(await upsertPrices(req.orgId!, body.items));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/prices",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const locationId =
        typeof req.query.locationId === "string" ? req.query.locationId : undefined;
      res.json({ prices: await listPrices(req.orgId!, locationId) });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.put(
  "/merchants/orgs/:orgId/promotions",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          promotionId: z.string().optional(),
          code: z.string().trim().min(1).max(40),
          name: z.string().trim().min(1).max(120),
          percentOff: z.number().min(0).max(100).optional(),
          amountOffCents: z.number().int().nonnegative().optional(),
          productIds: z.array(z.string()).max(200).optional(),
          locationIds: z.array(z.string()).max(50).optional(),
          startsAt: z.string().datetime(),
          endsAt: z.string().datetime(),
          active: z.boolean().optional(),
        })
        .parse(req.body);
      res.json(await upsertPromotion({ orgId: req.orgId!, ...body }));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/promotions",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ promotions: await listPromotions(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

// ---- Orders & returns ----
platformRouter.post(
  "/merchants/orgs/:orgId/orders",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          externalOrderId: z.string().trim().min(1).max(120),
          locationId: z.string().trim().max(80).optional(),
          status: z.string().trim().max(40).optional(),
          currency: z.string().trim().length(3).optional(),
          customerRef: z.string().trim().max(120).optional(),
          fulfillment: z
            .enum(["ship", "click_and_collect", "reserve", "in_store"])
            .optional(),
          lines: z
            .array(
              z.object({
                lineId: z.string().trim().min(1).max(120),
                productId: documentIdSchema.optional(),
                sku: z.string().max(80).optional(),
                sizeSystem: z.enum(["uk", "us", "eu", "mondopoint"]).optional(),
                sizeLabel: z.string().max(32).optional(),
                widthLabel: z.string().max(32).optional(),
                quantity: z.number().int().positive().optional(),
                unitAmountCents: z.number().int().nonnegative().optional(),
                status: z.string().max(40).optional(),
              }),
            )
            .min(1)
            .max(100),
          data: z.record(z.unknown()).optional(),
        })
        .parse(req.body);
      const result = await ingestOrder({
        orgId: req.orgId!,
        ...body,
        actorId: req.uid,
      });
      await enqueueWebhookEvent({
        orgId: req.orgId!,
        eventType: "order.ingested",
        payload: { orderId: result.orderId, externalOrderId: body.externalOrderId },
      }).catch(() => undefined);
      await recordUsage({ orgId: req.orgId!, metric: "order_ingest" }).catch(
        () => undefined,
      );
      res.status(result.reused ? 200 : 201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/orders",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ orders: await listOrders(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/returns",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          orderId: z.string().trim().min(1),
          lineId: z.string().trim().optional(),
          kind: z.enum(["return", "exchange"]),
          reason: z.string().trim().max(120).optional(),
          status: z.string().trim().max(40).optional(),
          data: z.record(z.unknown()).optional(),
        })
        .parse(req.body);
      const result = await createReturn({ orgId: req.orgId!, ...body });
      await enqueueWebhookEvent({
        orgId: req.orgId!,
        eventType: "return.created",
        payload: { returnId: result.returnId, ...body },
      }).catch(() => undefined);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/returns",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ returns: await listReturns(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

// ---- Webhooks ----
platformRouter.post(
  "/merchants/orgs/:orgId/webhooks",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          url: z.string().url().max(500),
          events: z.array(z.string().min(1).max(80)).min(1).max(40),
        })
        .parse(req.body);
      const result = await createWebhookEndpoint({
        orgId: req.orgId!,
        ...body,
        actorId: req.uid,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/webhooks",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ endpoints: await listWebhookEndpoints(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/webhooks/deliveries",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const deadLetterOnly = req.query.deadLetter === "1";
      res.json({
        deliveries: await listWebhookDeliveries(req.orgId!, { deadLetterOnly }),
      });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/webhooks/deliveries/:deliveryId/retry",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const ok = await retryDeadLetter(String(req.params.deliveryId), req.orgId!);
      res.status(ok ? 200 : 404).json({ ok });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/webhooks/process",
  requireOrgRole("admin"),
  async (_req: MerchantRequest, res, next) => {
    try {
      res.json(await processWebhookDeliveries(50));
    } catch (err) {
      next(err);
    }
  },
);

// ---- Invitations ----
platformRouter.post(
  "/merchants/orgs/:orgId/invitations",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          email: z.string().email().max(200),
          role: z.enum(["owner", "admin", "operator", "viewer"]),
        })
        .parse(req.body);
      const result = await createInvitation({
        orgId: req.orgId!,
        email: body.email,
        role: body.role,
        invitedByDeviceId: req.uid,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/invitations",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ invitations: await listInvitations(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/invitations/accept",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const body = z.object({ token: z.string().min(10) }).parse(req.body);
      const result = await acceptInvitation({ token: body.token, deviceId: req.uid });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// ---- Reconciliation, monitoring, credentials ----
platformRouter.post(
  "/merchants/orgs/:orgId/reconciliation",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          kind: z
            .enum(["inventory_orders", "prices_catalogue", "outcomes_orders"])
            .optional(),
        })
        .parse(req.body ?? {});
      res.json(await runReconciliation(req.orgId!, body.kind));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/integrations/health",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          integrationKind: z.string().trim().min(1).max(40),
          status: z.enum(["ok", "degraded", "error"]),
          latencyMs: z.number().int().nonnegative().optional(),
          detail: z.string().max(500).optional(),
        })
        .parse(req.body);
      res
        .status(201)
        .json(await recordIntegrationCheck({ orgId: req.orgId!, ...body }));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/integrations/health",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ checks: await listIntegrationHealth(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/credentials/rotate",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          kind: z.string().trim().min(1).max(40),
          note: z.string().max(500).optional(),
        })
        .parse(req.body);
      res.status(201).json(
        await recordCredentialRotation({
          orgId: req.orgId!,
          kind: body.kind,
          actorDeviceId: req.uid,
          note: body.note,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

// ---- CSV fallback ----
platformRouter.post(
  "/merchants/orgs/:orgId/csv/:kind",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const kind = String(req.params.kind);
      const body = z.object({ csv: z.string().min(1).max(2_000_000) }).parse(req.body);
      const rows = parseCsvTable(body.csv);
      if (rows.length < 2) {
        res.status(400).json({ error: "csv_needs_header_and_row" });
        return;
      }
      const header = rows[0].map((h) => h.toLowerCase());
      const data = rows.slice(1);
      if (kind === "inventory") {
        const idx = {
          productId: header.indexOf("productid"),
          sizeSystem: header.indexOf("sizesystem"),
          sizeLabel: header.indexOf("sizelabel"),
          widthLabel: header.indexOf("widthlabel"),
          locationId: header.indexOf("locationid"),
          quantity: header.indexOf("quantity"),
        };
        if (
          idx.productId < 0 ||
          idx.sizeSystem < 0 ||
          idx.sizeLabel < 0 ||
          idx.quantity < 0
        ) {
          res.status(400).json({
            error: "csv_columns_required",
            required: ["productId", "sizeSystem", "sizeLabel", "quantity"],
          });
          return;
        }
        const items = data.map((r) => ({
          productId: r[idx.productId],
          sizeSystem: r[idx.sizeSystem] as "uk" | "us" | "eu" | "mondopoint",
          sizeLabel: r[idx.sizeLabel],
          widthLabel: idx.widthLabel >= 0 ? r[idx.widthLabel] : undefined,
          locationId: idx.locationId >= 0 ? r[idx.locationId] : undefined,
          quantity: Number(r[idx.quantity] || 0),
        }));
        res.json(await upsertInventory(req.orgId!, items));
        return;
      }
      if (kind === "prices") {
        const idx = {
          productId: header.indexOf("productid"),
          amountCents: header.indexOf("amountcents"),
          currency: header.indexOf("currency"),
          locationId: header.indexOf("locationid"),
        };
        if (idx.productId < 0 || idx.amountCents < 0) {
          res.status(400).json({ error: "csv_columns_required" });
          return;
        }
        res.json(
          await upsertPrices(
            req.orgId!,
            data.map((r) => ({
              productId: r[idx.productId],
              amountCents: Number(r[idx.amountCents] || 0),
              currency: idx.currency >= 0 ? r[idx.currency] : "ZAR",
              locationId: idx.locationId >= 0 ? r[idx.locationId] : undefined,
            })),
          ),
        );
        return;
      }
      if (kind === "catalogue") {
        const idx = {
          productId: header.indexOf("productid"),
          brand: header.indexOf("brand"),
          model: header.indexOf("model"),
          category: header.indexOf("category"),
          fitType: header.indexOf("fittype"),
          min: header.indexOf("sizerangeeumin"),
          max: header.indexOf("sizerangeeumax"),
        };
        if (
          idx.productId < 0 ||
          idx.brand < 0 ||
          idx.model < 0 ||
          idx.min < 0 ||
          idx.max < 0
        ) {
          res.status(400).json({ error: "csv_columns_required" });
          return;
        }
        const products = data.map((r) => ({
          productId: r[idx.productId],
          brand: r[idx.brand],
          model: r[idx.model],
          category: idx.category >= 0 ? r[idx.category] : "footwear",
          fitType: idx.fitType >= 0 ? r[idx.fitType] : "standard",
          sizeRangeEu: {
            min: Number(r[idx.min]),
            max: Number(r[idx.max]),
            step: 1,
          },
        }));
        res.json(await ingestProducts(req.orgId!, products));
        return;
      }
      res
        .status(400)
        .json({
          error: "unknown_csv_kind",
          allowed: ["inventory", "prices", "catalogue"],
        });
    } catch (err) {
      next(err);
    }
  },
);

// ---- Commercial: usage, invoices, support, certs, pilots, onboarding ----
platformRouter.post(
  "/merchants/orgs/:orgId/usage",
  requireOrgRole("operator"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          metric: z.string().trim().min(1).max(60),
          quantity: z.number().positive().optional(),
          data: z.record(z.unknown()).optional(),
        })
        .parse(req.body);
      res.status(201).json(await recordUsage({ orgId: req.orgId!, ...body }));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/usage",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const period =
        typeof req.query.period === "string" ? req.query.period : undefined;
      res.json(await usageSummary(req.orgId!, period));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/entitlements/:feature",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json(await checkEntitlement(req.orgId!, String(req.params.feature)));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/invoices/generate",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          periodKey: z.string().optional(),
          amountCents: z.number().int().nonnegative().optional(),
        })
        .parse(req.body ?? {});
      res.status(201).json(await generateInvoice(req.orgId!, body));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/invoices/reconcile",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          periodKey: z.string().min(4),
          externalRef: z.string().min(1).max(120),
          amountCents: z.number().int().nonnegative(),
        })
        .parse(req.body);
      res.json(await reconcilePayment({ orgId: req.orgId!, ...body }));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/invoices",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ invoices: await listInvoices(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/support/tickets",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          subject: z.string().trim().min(3).max(200),
          body: z.string().trim().min(3).max(5000),
          priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
        })
        .parse(req.body);
      res.status(201).json(
        await createSupportTicket({
          orgId: req.orgId!,
          subject: body.subject,
          body: body.body,
          priority: body.priority,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/support/tickets",
  requireOrgRole("viewer"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json({ tickets: await listTickets(req.orgId!) });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/support/tickets/:ticketId/escalate",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      await escalateTicket(String(req.params.ticketId), req.body?.note);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/support/tickets/:ticketId/resolve",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      await resolveTicket(String(req.params.ticketId), req.body?.note);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get(
  "/merchants/orgs/:orgId/support/sla",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      res.json(await slaReport(req.orgId!));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.put(
  "/merchants/orgs/:orgId/certifications",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          connector: z.string().trim().min(1).max(60),
          status: z.enum(["pending", "in_review", "certified", "revoked"]).optional(),
          checklist: z.record(z.unknown()).optional(),
        })
        .parse(req.body);
      res.json(await upsertCertification({ orgId: req.orgId!, ...body }));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.put(
  "/merchants/orgs/:orgId/pilot-contracts",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z
        .object({
          contractId: z.string().optional(),
          title: z.string().trim().min(3).max(200),
          successCriteria: z.array(z.unknown()).min(1).max(40),
          pricingNotes: z.string().max(2000).optional(),
          status: z.enum(["draft", "active", "completed", "cancelled"]).optional(),
          startsAt: z.string().datetime().optional(),
          endsAt: z.string().datetime().optional(),
        })
        .parse(req.body);
      res.json(await upsertPilotContract({ orgId: req.orgId!, ...body }));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/merchants/orgs/:orgId/onboarding/step",
  requireOrgRole("admin"),
  async (req: MerchantRequest, res, next) => {
    try {
      const body = z.object({ step: z.string().trim().min(1).max(60) }).parse(req.body);
      res.json(await advanceOnboarding(req.orgId!, body.step));
    } catch (err) {
      next(err);
    }
  },
);

// ---- Compliance (operator / admin) ----
platformRouter.get(
  "/compliance/processing-register",
  requireAuth,
  async (_req, res, next) => {
    try {
      res.json({ entries: await listProcessingRegister() });
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post(
  "/compliance/dsar",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const body = z
        .object({
          type: z.enum(["access", "export", "erasure", "rectification"]),
          accountId: z.string().optional(),
          email: z.string().email().optional(),
          notes: z.string().max(1000).optional(),
        })
        .parse(req.body);
      res.status(201).json(
        await createDsarRequest({
          ...body,
          deviceId: req.uid,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get("/compliance/dsar", requireAuth, async (_req, res, next) => {
  try {
    res.json({ requests: await listDsarRequests() });
  } catch (err) {
    next(err);
  }
});

platformRouter.patch(
  "/compliance/dsar/:requestId",
  requireAuth,
  async (req, res, next) => {
    try {
      const body = z
        .object({
          status: z.enum(["received", "in_progress", "completed", "rejected"]),
          resultRef: z.string().optional(),
          notes: z.string().optional(),
        })
        .parse(req.body);
      await updateDsarStatus({ requestId: String(req.params.requestId), ...body });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.post("/compliance/breaches", requireAuth, async (req, res, next) => {
  try {
    const body = z
      .object({
        title: z.string().min(3).max(200),
        severity: z.enum(["low", "medium", "high", "critical"]),
        discoveredAt: z.string().datetime().optional(),
        detail: z.record(z.unknown()).optional(),
      })
      .parse(req.body);
    res.status(201).json(await createBreachIncident(body));
  } catch (err) {
    next(err);
  }
});

platformRouter.get("/compliance/breaches", requireAuth, async (_req, res, next) => {
  try {
    res.json({ incidents: await listBreachIncidents() });
  } catch (err) {
    next(err);
  }
});

platformRouter.patch(
  "/compliance/breaches/:incidentId",
  requireAuth,
  async (req, res, next) => {
    try {
      const body = z
        .object({
          status: z.enum(["open", "contained", "notified", "closed"]).optional(),
          notifiedRegulator: z.boolean().optional(),
          notifiedSubjects: z.boolean().optional(),
          detail: z.record(z.unknown()).optional(),
        })
        .parse(req.body);
      await updateBreachIncident({
        incidentId: String(req.params.incidentId),
        ...body,
      });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.put(
  "/compliance/operator-agreements",
  requireAuth,
  async (req, res, next) => {
    try {
      const body = z
        .object({
          agreementId: z.string().optional(),
          orgId: z.string().optional(),
          counterparty: z.string().min(2).max(200),
          kind: z.string().min(2).max(60),
          version: z.string().min(1).max(40),
          signedAt: z.string().datetime().optional(),
          documentRef: z.string().max(500).optional(),
        })
        .parse(req.body);
      res.json(await upsertOperatorAgreement(body));
    } catch (err) {
      next(err);
    }
  },
);

platformRouter.get("/compliance/audit/verify", requireAuth, async (_req, res, next) => {
  try {
    res.json(await verifyAuditChain());
  } catch (err) {
    next(err);
  }
});

platformRouter.get(
  "/compliance/retention/verify",
  requireAuth,
  async (_req, res, next) => {
    try {
      res.json(await verifyRetentionJob());
    } catch (err) {
      next(err);
    }
  },
);

/** Internal/ops: process webhooks without org context (cron). */
platformRouter.post("/ops/webhooks/process", requireAuth, async (_req, res, next) => {
  try {
    res.json(await processWebhookDeliveries(100));
  } catch (err) {
    next(err);
  }
});

/** Nonce helper for clients that need a random challenge without WebAuthn lib. */
platformRouter.get("/ops/nonce", (_req, res) => {
  res.json({ nonce: randomBytes(16).toString("base64url") });
});
