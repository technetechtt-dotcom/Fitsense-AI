import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error("[fitsense-api]", err);
  if (res.headersSent) return;
  res.status(500).json({
    error: "internal_error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err instanceof Error
          ? err.message
          : "Unknown error",
  });
}
