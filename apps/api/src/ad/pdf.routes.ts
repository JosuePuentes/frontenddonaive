/**
 * Endpoints PDF descargables A&D.
 */
import { Router } from "express";
import { getAdContext } from "./middleware.js";
import { requireAdPermission } from "./authorization.js";
import { getPrisma } from "../config/database.js";
import { NotFoundError } from "../errors/app-error.js";
import { buildPurchasePdf, pdfToBuffer } from "./pdf/purchase-pdf.js";
import { Prisma } from "@prisma/client";

function num(v: Prisma.Decimal | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export const adPdfRouter = Router();

adPdfRouter.get("/documents/purchases/:id/pdf", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    requireAdPermission(ctx, "purchases.manage");
    const prisma = getPrisma();
    const purchase = await prisma.adPurchase.findFirst({
      where: { id: req.params.id, tenantId: ctx.tenantId },
      include: {
        lines: { include: { product: true, presentation: true } },
        supplier: true,
        paymentMethod: true,
        warehouse: true,
      },
    });
    if (!purchase) throw new NotFoundError("Compra no encontrada");

    const currency = purchase.currency;
    const doc = buildPurchasePdf({
      documentTitle: "Documento de compra",
      invoiceNumber: purchase.invoiceNumber,
      status: purchase.status,
      supplierName: purchase.supplierName,
      warehouseName: purchase.warehouse.name,
      invoiceDate: purchase.invoiceDate?.toISOString().slice(0, 10) ?? null,
      currency,
      paymentMethodName: purchase.paymentMethod?.name ?? null,
      paymentCondition: purchase.paymentCondition,
      creditDays: purchase.creditDays,
      dueDate: purchase.dueDate?.toISOString().slice(0, 10) ?? null,
      lines: purchase.lines.map((l) => ({
        code: l.product.sku,
        description: l.product.name,
        brand: l.product.brand,
        presentation: l.presentation.name,
        qty: num(l.qty),
        qtyBonus: num(l.qtyBonus),
        unitCost:
          currency === "BS" ? num(l.unitCostBs) : num(l.unitCostUsd),
        presentationCost:
          currency === "BS"
            ? num(l.presentationCostBs)
            : num(l.presentationCostUsd),
        lineTotal:
          currency === "BS" ? num(l.lineCostBs) : num(l.lineCostUsd),
        taxable: l.taxable,
      })),
      subtotal:
        currency === "BS" ? num(purchase.subtotalBs) : num(purchase.subtotalUsd),
      tax: currency === "BS" ? num(purchase.taxBs) : num(purchase.taxUsd),
      grandTotal:
        currency === "BS"
          ? num(purchase.grandTotalBs)
          : num(purchase.grandTotalUsd),
    });

    const buf = await pdfToBuffer(doc);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="compra-${purchase.invoiceNumber}.pdf"`,
    );
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

adPdfRouter.get("/documents/purchase-orders/:id/pdf", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    requireAdPermission(ctx, "purchase-orders.create");
    const prisma = getPrisma();
    const po = await prisma.adPurchaseOrder.findFirst({
      where: { id: req.params.id, tenantId: ctx.tenantId },
      include: {
        lines: { include: { product: true, presentation: true } },
        supplier: true,
      },
    });
    if (!po) throw new NotFoundError("OC no encontrada");

    const warehouse = po.warehouseId
      ? await prisma.adWarehouse.findUnique({ where: { id: po.warehouseId } })
      : null;

    const doc = buildPurchasePdf({
      documentTitle: "Orden de compra",
      invoiceNumber: po.documentNumber,
      status: po.status,
      supplierName: po.supplier?.name ?? "—",
      warehouseName: warehouse?.name ?? "—",
      invoiceDate: po.createdAt.toISOString().slice(0, 10),
      currency: "USD",
      paymentCondition: "—",
      lines: po.lines.map((l) => ({
        code: l.product.sku,
        description: l.product.name,
        brand: l.product.brand,
        presentation: l.presentation?.name ?? "base",
        qty: num(l.qtyBase),
        unitCost: num(l.product.avgCostUsd),
        presentationCost: 0,
        lineTotal: num(l.qtyBase) * num(l.product.avgCostUsd),
      })),
      subtotal: po.lines.reduce(
        (a, l) => a + num(l.qtyBase) * num(l.product.avgCostUsd),
        0,
      ),
      tax: 0,
      grandTotal: po.lines.reduce(
        (a, l) => a + num(l.qtyBase) * num(l.product.avgCostUsd),
        0,
      ),
    });

    const buf = await pdfToBuffer(doc);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="oc-${po.documentNumber}.pdf"`,
    );
    res.send(buf);
  } catch (err) {
    next(err);
  }
});
