import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export interface RequestWithContext extends Request {
  requestId?: string;
}

function normalizeRequestId(value: string | undefined): string {
  if (value && /^[A-Za-z0-9_.:-]{8,128}$/.test(value)) return value;
  return crypto.randomUUID();
}

export function requestContext(
  req: RequestWithContext,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();
  const requestId = normalizeRequestId(req.header("x-request-id") ?? undefined);
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const log = {
      level: res.statusCode >= 500 ? "error" : "info",
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: req.ip,
    };
    console.log(JSON.stringify(log));
  });

  next();
}
