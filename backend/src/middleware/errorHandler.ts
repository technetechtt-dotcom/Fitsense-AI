import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import type { RequestWithContext } from "./requestContext.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as RequestWithContext).requestId;
  if (res.headersSent) return;

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "invalid_request",
      requestId,
      issues: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: "invalid_json",
      requestId,
    });
    return;
  }

  console.error("[fitsense-api]", requestId ?? "-", err);
  res.status(500).json({
    error: "internal_error",
    requestId,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err instanceof Error
          ? err.message
          : "Unknown error",
  });
}
