import type { NextFunction, Request, Response } from "express";
import { config } from "../config.js";

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  name: string;
  windowMs?: number;
  max?: number;
  key?: (req: Request) => string;
}

const buckets = new Map<string, Bucket>();

function defaultKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function rateLimit(options: RateLimitOptions) {
  const windowMs = options.windowMs ?? config.rateLimit.windowMs;
  const max = options.max ?? config.rateLimit.globalMax;
  const keyFn = options.key ?? defaultKey;

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const id = `${options.name}:${keyFn(req)}`;
    let bucket = buckets.get(id);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(id, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      res.setHeader(
        "Retry-After",
        String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
      );
      res.status(429).json({ error: "rate_limited" });
      return;
    }

    if (buckets.size > 10_000) {
      for (const [bucketId, entry] of buckets) {
        if (entry.resetAt <= now) buckets.delete(bucketId);
      }
    }

    next();
  };
}

export function resetRateLimitersForTest(): void {
  buckets.clear();
}
