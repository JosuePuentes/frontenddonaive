import { Router } from "express";
import { getAdContext } from "./middleware.js";
import { adCommerceService } from "./commerce.service.js";
import {
  confirmPurchaseSchema,
  createComboSchema,
  createCommercePurchaseSchema,
  createProductFromPurchaseSchema,
  createPromotionSchema,
  createPurchaseOrderSchema,
  createSupplierSchema,
  commercePurchaseLineSchema,
  importConfirmSchema,
  importPreviewSchema,
  parseBody,
  payablePaymentSchema,
  replenishmentSchema,
  searchProductsSchema,
  setBcvRateSchema,
  setPresentationPriceSchema,
  setProtectedRateSchema,
  updateCommercePurchaseLineSchema,
  updateCommercePurchaseSchema,
  updatePromotionSchema,
  updatePurchaseOrderSchema,
  updateSupplierSchema,
  upsertPaymentMethodSchema,
} from "./commerce.validation.js";

export const adCommerceRouter = Router();

/** Productos — búsqueda / escaneo (contrato). */
adCommerceRouter.get("/products/search", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const q = searchProductsSchema.parse(req.query);
    const data = await adCommerceService.searchProducts(ctx, q);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.get("/products/by-code", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const code = String(req.query.code ?? "");
    const source = String(req.query.source ?? "manual") as
      | "manual"
      | "camera"
      | "wedge";
    const data = await adCommerceService.lookupByCode(ctx, { code, source });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** Proveedores */
adCommerceRouter.get("/suppliers", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.listSuppliers(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/suppliers", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createSupplierSchema, req.body);
    const data = await adCommerceService.createSupplier(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.get("/suppliers/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.getSupplierDetail(ctx, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.patch("/suppliers/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(updateSupplierSchema, req.body);
    const data = await adCommerceService.updateSupplier(ctx, req.params.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** Compras F5 (multi-línea, bonificación, CxP). */
adCommerceRouter.post("/commerce/purchases", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createCommercePurchaseSchema, req.body);
    const data = await adCommerceService.createPurchase(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.get("/commerce/purchases/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.getPurchase(ctx, req.params.id);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.put("/commerce/purchases/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(updateCommercePurchaseSchema, req.body);
    const data = await adCommerceService.updatePurchase(
      ctx,
      req.params.id,
      body,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/commerce/purchases/:id/lines", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(commercePurchaseLineSchema, req.body);
    const data = await adCommerceService.addPurchaseLine(
      ctx,
      req.params.id,
      body,
    );
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.patch(
  "/commerce/purchases/:id/lines/:lineId",
  async (req, res, next) => {
    try {
      const ctx = getAdContext(req);
      const body = parseBody(updateCommercePurchaseLineSchema, req.body);
      const data = await adCommerceService.updatePurchaseLine(
        ctx,
        req.params.id,
        req.params.lineId,
        body,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

adCommerceRouter.delete(
  "/commerce/purchases/:id/lines/:lineId",
  async (req, res, next) => {
    try {
      const ctx = getAdContext(req);
      const data = await adCommerceService.deletePurchaseLine(
        ctx,
        req.params.id,
        req.params.lineId,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

adCommerceRouter.post(
  "/commerce/purchases/:id/totalize",
  async (req, res, next) => {
    try {
      const ctx = getAdContext(req);
      const data = await adCommerceService.totalizePurchase(ctx, req.params.id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

adCommerceRouter.post("/commerce/purchases/:id/confirm", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(confirmPurchaseSchema, req.body ?? {});
    const data = await adCommerceService.confirmPurchase(ctx, req.params.id, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/commerce/products", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createProductFromPurchaseSchema, req.body);
    const data = await adCommerceService.createProductFromPurchase(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

/** Cuentas por pagar */
adCommerceRouter.get("/payables", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.listPayables(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/payables/:id/payments", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(payablePaymentSchema, req.body);
    const data = await adCommerceService.payPayable(ctx, req.params.id, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

/** Tasas */
adCommerceRouter.get("/rates/bcv", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.getBcvRate(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/rates/bcv", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(setBcvRateSchema, req.body);
    const data = await adCommerceService.setBcvRate(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.get("/rates/protected", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.getProtectedRate(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/rates/protected", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(setProtectedRateSchema, req.body);
    const data = await adCommerceService.setProtectedRate(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

/** Métodos de pago */
adCommerceRouter.get("/payment-methods", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.listPaymentMethods(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/payment-methods", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(upsertPaymentMethodSchema, req.body);
    const data = await adCommerceService.upsertPaymentMethod(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

/** Precios / promociones / combos */
adCommerceRouter.post("/pricing/presentation", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(setPresentationPriceSchema, req.body);
    const data = await adCommerceService.setPresentationPrice(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.get("/pricing/pos", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const presentationId = String(req.query.presentationId ?? "");
    const paymentMethodId = req.query.paymentMethodId
      ? String(req.query.paymentMethodId)
      : undefined;
    const data = await adCommerceService.resolvePosPrice(ctx, {
      presentationId,
      paymentMethodId,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/promotions", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createPromotionSchema, req.body);
    const data = await adCommerceService.createPromotion(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.get("/promotions", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.listPromotions(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.patch("/promotions/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(updatePromotionSchema, req.body);
    const data = await adCommerceService.updatePromotion(
      ctx,
      req.params.id,
      body,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/combos", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createComboSchema, req.body);
    const data = await adCommerceService.createCombo(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

/** Análisis / reposición / OC */
adCommerceRouter.get("/commerce/analysis", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.purchaseAnalysis(ctx, {
      supplierId: req.query.supplierId
        ? String(req.query.supplierId)
        : undefined,
      productId: req.query.productId ? String(req.query.productId) : undefined,
      brand: req.query.brand ? String(req.query.brand) : undefined,
      warehouseId: req.query.warehouseId
        ? String(req.query.warehouseId)
        : undefined,
      from: req.query.from ? String(req.query.from) : undefined,
      to: req.query.to ? String(req.query.to) : undefined,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.get("/commerce/replenishment", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = replenishmentSchema.parse(req.query);
    const data = await adCommerceService.replenishmentSuggestions(ctx, body);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.get("/commerce/purchase-orders", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const data = await adCommerceService.listPurchaseOrders(ctx);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/commerce/purchase-orders", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(createPurchaseOrderSchema, req.body);
    const data = await adCommerceService.createPurchaseOrder(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.patch("/commerce/purchase-orders/:id", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(updatePurchaseOrderSchema, req.body);
    const data = await adCommerceService.updatePurchaseOrder(
      ctx,
      req.params.id,
      body,
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

/** Importación Excel (JSON rows — contrato preview→confirm). */
adCommerceRouter.post("/imports/preview", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(importPreviewSchema, req.body);
    const data = await adCommerceService.importPreview(ctx, body);
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

adCommerceRouter.post("/imports/confirm", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    const body = parseBody(importConfirmSchema, req.body);
    const data = await adCommerceService.importConfirm(ctx, body.batchId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});
