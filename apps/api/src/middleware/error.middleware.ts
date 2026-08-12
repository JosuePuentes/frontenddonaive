import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.js";
import { isDatabaseConfigured } from "../config/env.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  console.error("[api] unhandled error", err);

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Error interno del servidor",
    },
  });
}

export function databaseGuard(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isDatabaseConfigured()) {
    res.status(503).json({
      error: {
        code: "DATABASE_NOT_CONFIGURED",
        message:
          "DATABASE_URL no configurada. Configure apps/api/.env para habilitar persistencia.",
      },
    });
    return;
  }
  next();
}
