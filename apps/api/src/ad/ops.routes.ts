import { Router } from "express";
import { getAdContext } from "./middleware.js";
import { adOpsService } from "./ops.service.js";
import {
  addAccountItemSchema,
  cashClosureSchema,
  closeAccountSchema,
  consumePrepaidSchema,
  createAccountSchema,
  createPrepaidSchema,
  createPurchaseOpsSchema,
  createTransferSchema,
  inventoryClosureSchema,
  parseBody,
  purchaseRequestSchema,
  serveAccountItemSchema,
  voidAccountSchema,
} from "./validation.js";

export const adOpsRouter = Router();

/** Cuentas / mesonera */
adOpsRouter.post("/accounts", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createAccountSchema, req.body);
    const data = await adOpsService.createAccount(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/accounts/:id/items", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(addAccountItemSchema, req.body);
    const data = await adOpsService.addAccountItem(ctx, req.params.id, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/accounts/:id/serve", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(serveAccountItemSchema, req.body);
    const data = await adOpsService.serveAccountItem(ctx, req.params.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/accounts/:id/close", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(closeAccountSchema, req.body ?? {});
    const data = await adOpsService.closeAccount(ctx, req.params.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/accounts/:id/void", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(voidAccountSchema, req.body);
    const data = await adOpsService.voidAccount(ctx, req.params.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** Inventario / disponibilidad */
adOpsRouter.get("/inventory/availability", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const productId = String(req.query.productId ?? "");
    if (!productId) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "productId requerido" },
      });
      return;
    }
    const requestedBase = req.query.requestedBase
      ? Number(req.query.requestedBase)
      : 0;
    const preferredWarehouseId =
      typeof req.query.warehouseId === "string"
        ? req.query.warehouseId
        : undefined;
    const data = await adOpsService.getAvailability(
      ctx,
      productId,
      requestedBase,
      preferredWarehouseId,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** Alias pedido en spec */
adOpsRouter.get("/inventory", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const productId = String(req.query.productId ?? "");
    if (!productId) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "productId requerido" },
      });
      return;
    }
    const data = await adOpsService.getAvailability(ctx, productId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** Compras */
adOpsRouter.post("/purchases", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createPurchaseOpsSchema, req.body);
    const data = await adOpsService.createPurchase(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/purchases/:id/receive", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adOpsService.receivePurchase(ctx, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** Transferencias (atómicas v1) */
adOpsRouter.post("/transfers", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createTransferSchema, req.body);
    const data = await adOpsService.createTransfer(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/transfers/:id/receive", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adOpsService.confirmTransferAtomic(ctx, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/transfers/:id/confirm", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adOpsService.confirmTransferAtomic(ctx, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** Prepagos / QR */
adOpsRouter.post("/prepaids", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createPrepaidSchema, req.body);
    const data = await adOpsService.createPrepaid(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/prepaids/:id/consume", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(consumePrepaidSchema, req.body);
    const data = await adOpsService.consumePrepaid(ctx, req.params.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.get("/qr/:token", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adOpsService.findPrepaidByQr(ctx, req.params.token);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.get("/qr", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const token = String(req.query.token ?? "");
    if (!token) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "token requerido" },
      });
      return;
    }
    const data = await adOpsService.findPrepaidByQr(ctx, token);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** COP */
adOpsRouter.get("/cop/availability", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const productId = String(req.query.productId ?? "");
    if (!productId) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "productId requerido" },
      });
      return;
    }
    const requestedBase = req.query.requestedBase
      ? Number(req.query.requestedBase)
      : 0;
    const data = await adOpsService.getAvailability(
      ctx,
      productId,
      requestedBase,
      typeof req.query.warehouseId === "string"
        ? req.query.warehouseId
        : undefined,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/cop/purchase-requests", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(purchaseRequestSchema, req.body);
    const data = await adOpsService.createPurchaseRequest(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

/** Cierres */
adOpsRouter.post("/closures/cash", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(cashClosureSchema, req.body);
    const data = await adOpsService.createCashClosure(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adOpsRouter.post("/closures/inventory", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(inventoryClosureSchema, req.body);
    const data = await adOpsService.createInventoryClosure(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});
