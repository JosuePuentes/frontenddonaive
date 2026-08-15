import { z } from "zod";
import { Router } from "express";
import { getAdContext } from "./middleware.js";
import { adDashboardService } from "./dashboard.service.js";
import { parseBody } from "./validation.js";

export const dashboardQuerySchema = z.object({
  preset: z
    .enum([
      "hoy",
      "ayer",
      "semana",
      "ultimos_7_dias",
      "semana_anterior",
      "mes",
      "mes_anterior",
      "anio",
      "anio_anterior",
      "personalizado",
    ])
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  displayCurrency: z.enum(["USD", "BS"]).optional(),
  currency: z.enum(["USD", "BS"]).optional(),
  warehouseId: z.string().uuid().optional(),
});

export const dashboardDrillQuerySchema = z.object({
  section: z.string().min(1),
  from: z.string().optional(),
  to: z.string().optional(),
  accountId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export const adDashboardRouter = Router();

adDashboardRouter.get("/finance/dashboard", async (req, res, next) => {
  try {
    const q = dashboardQuerySchema.parse(req.query);
    const data = await adDashboardService.getDashboard(getAdContext(req), q);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adDashboardRouter.get("/finance/dashboard/drill", async (req, res, next) => {
  try {
    const q = dashboardDrillQuerySchema.parse(req.query);
    const data = await adDashboardService.drillDown(getAdContext(req), q);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

void parseBody;
