import { Router } from "express";
import { adContextMiddleware, getAdContext } from "./middleware.js";
import { adService } from "./service.js";
import {
  createCustomerSchema,
  createPresentationSchema,
  createProductSchema,
  createSaleSchema,
  createWarehouseSchema,
  parseBody,
  setStockSchema,
  voidSaleSchema,
} from "./validation.js";

import { adOpsRouter } from "./ops.routes.js";
import { adPortalRouter } from "./portal.routes.js";

export const adRouter = Router();

/** Health A&D — requiere DB; no exige JWT. */
adRouter.get("/health", async (_req, res, next) => {
  try {
    const data = await adService.health();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** A partir de aquí: JWT A&D obligatorio (Fase 4). */
adRouter.use(adContextMiddleware);

/** Núcleo operativo Fase 2 */
adRouter.use(adOpsRouter);
/** Portal Fase 3 — operadores, snapshot, reportes */
adRouter.use(adPortalRouter);

adRouter.get("/context", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adService.getContext(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.get("/warehouses", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adService.listWarehouses(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.post("/warehouses", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createWarehouseSchema, req.body);
    const data = await adService.createWarehouse(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.get("/products", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adService.listProducts(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.post("/products", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createProductSchema, req.body);
    const data = await adService.createProduct(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.post("/products/:id/presentations", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createPresentationSchema, req.body);
    const data = await adService.createPresentation(ctx, req.params.id, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.get("/stock", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const warehouseId = String(req.query.warehouseId ?? "");
    if (!warehouseId) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "warehouseId requerido",
        },
      });
      return;
    }
    const productId =
      typeof req.query.productId === "string" ? req.query.productId : undefined;
    const data = await adService.getStock(ctx, warehouseId, productId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.put("/stock", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(setStockSchema, req.body);
    const data = await adService.setStock(ctx, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.get("/customers", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adService.listCustomers(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.post("/customers", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createCustomerSchema, req.body);
    const data = await adService.createCustomer(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.post("/sales", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createSaleSchema, req.body);
    const data = await adService.createSale(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.post("/sales/:id/void", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(voidSaleSchema, req.body);
    const data = await adService.voidSale(ctx, req.params.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adRouter.get("/audit", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const data = await adService.listAudit(ctx, limit);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
