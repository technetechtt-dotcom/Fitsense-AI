import { Router } from "express";
import { z } from "zod";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { config } from "../config.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  consumeRecoveryToken,
  consumeWebAuthnChallenge,
  createCustomerAccount,
  createReservation,
  deleteAccount,
  exportAccountData,
  getAccountForDevice,
  getWebAuthnCredential,
  listConsents,
  listDependants,
  listLocalAvailability,
  listWebAuthnCredentials,
  mintRecoveryToken,
  recordConsent,
  saveWebAuthnCredential,
  storeWebAuthnChallenge,
  updateWebAuthnCounter,
  upsertDependant,
} from "../services/customerAccounts.js";
import { createDsarRequest } from "../services/compliance.js";
import { documentIdSchema } from "../validation/schemas.js";

export const accountsRouter = Router();

accountsRouter.use(
  rateLimit({
    name: "accounts",
    max: config.rateLimit.authMax,
    key: (req) => `ip:${req.ip}`,
  }),
);

function rpConfig() {
  const rpID = process.env.WEBAUTHN_RP_ID?.trim() || "localhost";
  const rpName = process.env.WEBAUTHN_RP_NAME?.trim() || "FitSense";
  const origin =
    process.env.WEBAUTHN_ORIGIN?.trim() ||
    (typeof config.corsOrigin === "string"
      ? config.corsOrigin
      : Array.isArray(config.corsOrigin)
        ? config.corsOrigin[0]
        : `http://${rpID}:5173`);
  return { rpID, rpName, origin: origin || `http://${rpID}:5173` };
}

accountsRouter.post("/accounts", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (!req.uid) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
    const body = z
      .object({
        email: z.string().email().optional(),
        displayName: z.string().trim().max(120).optional(),
        locale: z.string().trim().max(20).optional(),
      })
      .parse(req.body ?? {});
    const result = await createCustomerAccount({
      deviceId: req.uid,
      ...body,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

accountsRouter.get(
  "/accounts/me",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      res.json(account);
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.post(
  "/accounts/webauthn/register/options",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      let account = await getAccountForDevice(req.uid);
      if (!account) {
        const created = await createCustomerAccount({ deviceId: req.uid });
        account = {
          accountId: created.accountId,
          email: null,
          displayName: null,
          locale: "en-ZA",
          status: "active",
        };
      }
      const { rpID, rpName } = rpConfig();
      const existing = await listWebAuthnCredentials(account.accountId);
      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: account.email || account.accountId,
        userDisplayName: account.displayName || "FitSense user",
        userID: new TextEncoder().encode(account.accountId),
        attestationType: "none",
        excludeCredentials: existing.map((c) => ({
          id: c.credentialId,
          transports: Array.isArray(c.transports)
            ? (c.transports as AuthenticatorTransport[])
            : undefined,
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });
      const { challengeId } = await storeWebAuthnChallenge({
        type: "registration",
        challenge: options.challenge,
        accountId: account.accountId,
        deviceId: req.uid,
      });
      res.json({ ...options, challengeId, accountId: account.accountId });
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.post(
  "/accounts/webauthn/register/verify",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const body = z
        .object({
          challengeId: z.string().min(1),
          response: z.record(z.unknown()),
        })
        .parse(req.body);
      const challenge = await consumeWebAuthnChallenge(body.challengeId);
      if (!challenge || challenge.type !== "registration" || !challenge.accountId) {
        res.status(400).json({ error: "challenge_invalid" });
        return;
      }
      const { rpID, origin } = rpConfig();
      const verification = await verifyRegistrationResponse({
        response: body.response as unknown as RegistrationResponseJSON,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
      if (!verification.verified || !verification.registrationInfo) {
        res.status(400).json({ error: "registration_failed" });
        return;
      }
      const info = verification.registrationInfo;
      const credentialId =
        typeof info.credential.id === "string"
          ? info.credential.id
          : Buffer.from(info.credential.id).toString("base64url");
      const publicKey = Buffer.from(info.credential.publicKey).toString("base64url");
      await saveWebAuthnCredential({
        accountId: challenge.accountId,
        credentialId,
        publicKey,
        counter: info.credential.counter,
        transports: info.credential.transports,
        deviceType: info.credentialDeviceType,
        backedUp: info.credentialBackedUp,
      });
      res.status(201).json({ verified: true, credentialId });
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.post(
  "/accounts/webauthn/authenticate/options",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      const { rpID } = rpConfig();
      const existing = await listWebAuthnCredentials(account.accountId);
      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: existing.map((c) => ({
          id: c.credentialId,
          transports: Array.isArray(c.transports)
            ? (c.transports as AuthenticatorTransport[])
            : undefined,
        })),
        userVerification: "preferred",
      });
      const { challengeId } = await storeWebAuthnChallenge({
        type: "authentication",
        challenge: options.challenge,
        accountId: account.accountId,
        deviceId: req.uid,
      });
      res.json({ ...options, challengeId });
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.post(
  "/accounts/webauthn/authenticate/verify",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const body = z
        .object({
          challengeId: z.string().min(1),
          response: z.record(z.unknown()),
        })
        .parse(req.body);
      const challenge = await consumeWebAuthnChallenge(body.challengeId);
      if (!challenge || challenge.type !== "authentication") {
        res.status(400).json({ error: "challenge_invalid" });
        return;
      }
      const response = body.response as unknown as AuthenticationResponseJSON;
      const stored = await getWebAuthnCredential(response.id);
      if (!stored) {
        res.status(400).json({ error: "credential_unknown" });
        return;
      }
      const { rpID, origin } = rpConfig();
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: stored.credentialId,
          publicKey: Buffer.from(stored.publicKey, "base64url"),
          counter: stored.counter,
        },
      });
      if (!verification.verified) {
        res.status(400).json({ error: "authentication_failed" });
        return;
      }
      await updateWebAuthnCounter(
        stored.credentialId,
        verification.authenticationInfo.newCounter,
      );
      res.json({ verified: true, accountId: stored.accountId });
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.put(
  "/accounts/dependants",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      const body = z
        .object({
          dependantId: z.string().optional(),
          displayName: z.string().trim().min(1).max(80),
          relationship: z.string().trim().max(40).optional(),
          fitId: documentIdSchema.optional(),
          consentGiven: z.literal(true),
        })
        .parse(req.body);
      res.json(await upsertDependant({ accountId: account.accountId, ...body }));
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.get(
  "/accounts/dependants",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      res.json({ dependants: await listDependants(account.accountId) });
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.post(
  "/accounts/consent",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      const body = z
        .object({
          purpose: z.string().trim().min(1).max(80),
          granted: z.boolean(),
          version: z.string().trim().min(1).max(40),
        })
        .parse(req.body);
      res
        .status(201)
        .json(await recordConsent({ accountId: account.accountId, ...body }));
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.get(
  "/accounts/consent",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      res.json({ consents: await listConsents(account.accountId) });
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.post(
  "/accounts/recovery/mint",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      res.status(201).json(await mintRecoveryToken(account.accountId));
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.post(
  "/accounts/recovery/consume",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const body = z.object({ token: z.string().min(10) }).parse(req.body);
      const result = await consumeRecoveryToken(body.token, req.uid);
      if (!result) {
        res.status(400).json({ error: "recovery_invalid" });
        return;
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.get(
  "/accounts/export",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      const data = await exportAccountData(account.accountId);
      await createDsarRequest({
        type: "export",
        accountId: account.accountId,
        deviceId: req.uid,
        notes: "self-service export",
      }).catch(() => undefined);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.delete(
  "/accounts/me",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const account = await getAccountForDevice(req.uid);
      if (!account) {
        res.status(404).json({ error: "account_not_found" });
        return;
      }
      await deleteAccount(account.accountId);
      await createDsarRequest({
        type: "erasure",
        accountId: account.accountId,
        deviceId: req.uid,
        notes: "self-service delete",
      }).catch(() => undefined);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.get(
  "/stores/availability",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      const q = z
        .object({
          orgId: z.string().min(1),
          productId: documentIdSchema,
          sizeSystem: z.enum(["uk", "us", "eu", "mondopoint"]),
          sizeLabel: z.string().min(1).max(32),
          widthLabel: z.string().max(32).optional(),
          region: z.string().max(80).optional(),
        })
        .parse(req.query);
      res.json({ stores: await listLocalAvailability(q) });
    } catch (err) {
      next(err);
    }
  },
);

accountsRouter.post(
  "/stores/reservations",
  requireAuth,
  async (req: AuthedRequest, res, next) => {
    try {
      if (!req.uid) {
        res.status(401).json({ error: "unauthorized" });
        return;
      }
      const body = z
        .object({
          orgId: z.string().min(1),
          locationId: z.string().min(1),
          productId: documentIdSchema,
          sizeSystem: z.enum(["uk", "us", "eu", "mondopoint"]),
          sizeLabel: z.string().min(1).max(32),
          widthLabel: z.string().max(32).optional(),
          holdMinutes: z
            .number()
            .int()
            .positive()
            .max(24 * 60)
            .optional(),
        })
        .parse(req.body);
      const account = await getAccountForDevice(req.uid);
      res.status(201).json(
        await createReservation({
          ...body,
          accountId: account?.accountId,
          deviceId: req.uid,
        }),
      );
    } catch (err) {
      next(err);
    }
  },
);

type AuthenticatorTransport =
  "ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb";
