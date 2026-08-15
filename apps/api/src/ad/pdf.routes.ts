/**
 * Endpoints PDF descargables A&D.
 */
import { Router } from "express";
import { getAdContext } from "./middleware.js";
import { requireAdPermission, requireWarehouseAccess } from "./authorization.js";
import { getPrisma } from "../config/database.js";
import { NotFoundError } from "../errors/app-error.js";
import { buildPurchasePdf, pdfToBuffer } from "./pdf/purchase-pdf.js";
import { buildOperationalPdf } from "./pdf/operational-pdf.js";
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

/** Transferencia de stock (COP). */
adPdfRouter.get("/documents/transfers/:id/pdf", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    requireAdPermission(ctx, "cop.transfer");
    const prisma = getPrisma();
    const transfer = await prisma.adStockTransfer.findFirst({
      where: { id: req.params.id, tenantId: ctx.tenantId },
      include: {
        lines: { include: { product: true, presentation: true } },
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
    if (!transfer) throw new NotFoundError("Transferencia no encontrada");
    requireWarehouseAccess(ctx, transfer.fromWarehouseId);
    requireWarehouseAccess(ctx, transfer.toWarehouseId);

    const doc = buildOperationalPdf({
      documentTitle: "Transferencia de inventario",
      subtitle: transfer.documentNumber,
      meta: [
        { label: "Estado", value: transfer.status },
        { label: "Origen", value: transfer.fromWarehouse.name },
        { label: "Destino", value: transfer.toWarehouse.name },
        { label: "Motivo", value: transfer.reason ?? "—" },
        {
          label: "Creada",
          value: transfer.createdAt.toISOString().slice(0, 19).replace("T", " "),
        },
        {
          label: "Confirmada",
          value: transfer.confirmedAt
            ? transfer.confirmedAt.toISOString().slice(0, 19).replace("T", " ")
            : "—",
        },
      ],
      tableHeaders: ["SKU", "Producto", "Marca", "Presentación", "Cant.", "Base"],
      rows: transfer.lines.map((l) => ({
        cells: [
          l.product.sku ?? "—",
          l.product.name.slice(0, 28),
          (l.product.brand ?? "—").slice(0, 14),
          (l.presentation?.name ?? "base").slice(0, 14),
          String(num(l.qty)),
          String(num(l.qtyBase)),
        ],
      })),
    });

    const buf = await pdfToBuffer(doc);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="transferencia-${transfer.documentNumber}.pdf"`,
    );
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

/** Recibo de venta confirmada. */
adPdfRouter.get("/documents/receipts/:id/pdf", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    requireAdPermission(ctx, "pos.sell");
    const prisma = getPrisma();
    const sale = await prisma.adSale.findFirst({
      where: {
        tenantId: ctx.tenantId,
        OR: [{ id: req.params.id }, { receiptNumber: req.params.id }],
      },
      include: {
        lines: { include: { product: true, presentation: true } },
        payments: true,
        warehouse: true,
        operator: true,
        customer: true,
      },
    });
    if (!sale) throw new NotFoundError("Recibo no encontrado");
    requireWarehouseAccess(ctx, sale.warehouseId);

    const doc = buildOperationalPdf({
      documentTitle: "Recibo de venta",
      subtitle: sale.receiptNumber,
      meta: [
        { label: "Estado", value: sale.status },
        { label: "Depósito", value: sale.warehouse.name },
        { label: "Cajero", value: sale.operator.name },
        { label: "Cliente", value: sale.customer?.name ?? "—" },
        {
          label: "Fecha",
          value: sale.createdAt.toISOString().slice(0, 19).replace("T", " "),
        },
      ],
      tableHeaders: ["Producto", "Pres.", "Cant.", "P.unit USD", "Total USD"],
      rows: sale.lines.map((l) => ({
        cells: [
          l.product.name.slice(0, 28),
          l.presentation.name.slice(0, 12),
          String(num(l.qty)),
          num(l.unitPriceUsd).toFixed(2),
          num(l.lineTotalUsd).toFixed(2),
        ],
      })),
      totals: [
        {
          label: "Total USD",
          value: num(sale.totalUsd).toFixed(2),
        },
        {
          label: "Total Bs",
          value: num(sale.totalBs).toFixed(2),
        },
        {
          label: "Descuento USD",
          value: num(sale.discountUsd).toFixed(2),
        },
        ...sale.payments.map((p) => ({
          label: `Pago ${p.method} (${p.currency})`,
          value: num(p.amount).toFixed(2),
        })),
      ],
    });

    const buf = await pdfToBuffer(doc);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="recibo-${sale.receiptNumber}.pdf"`,
    );
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

/** Cierre de caja. */
adPdfRouter.get("/documents/closures/:id/pdf", async (req, res, next) => {
  try {
    const ctx = getAdContext(req);
    requireAdPermission(ctx, "closures.create");
    const prisma = getPrisma();
    const closure = await prisma.adCashClosure.findFirst({
      where: { id: req.params.id, tenantId: ctx.tenantId },
      include: { warehouse: true },
    });
    if (!closure) throw new NotFoundError("Cierre no encontrado");
    requireWarehouseAccess(ctx, closure.warehouseId);

    const operator = await prisma.adOperator.findUnique({
      where: { id: closure.operatorId },
    });

    const snap =
      closure.snapshot && typeof closure.snapshot === "object"
        ? (closure.snapshot as Record<string, unknown>)
        : {};

    const doc = buildOperationalPdf({
      documentTitle: "Cierre de caja",
      subtitle: closure.id.slice(0, 8),
      meta: [
        { label: "Estado", value: closure.status },
        { label: "Depósito", value: closure.warehouse.name },
        { label: "Operador", value: operator?.name ?? closure.operatorId },
        {
          label: "Período",
          value: `${closure.periodStart.toISOString().slice(0, 16)} → ${closure.periodEnd.toISOString().slice(0, 16)}`,
        },
        {
          label: "Creado",
          value: closure.createdAt.toISOString().slice(0, 19).replace("T", " "),
        },
      ],
      tableHeaders: ["Concepto", "USD", "Bs"],
      rows: [
        {
          cells: [
            "Efectivo esperado",
            num(closure.expectedCashUsd).toFixed(2),
            num(closure.expectedCashBs).toFixed(2),
          ],
        },
        {
          cells: [
            "Efectivo contado",
            num(closure.countedCashUsd).toFixed(2),
            num(closure.countedCashBs).toFixed(2),
          ],
        },
        {
          cells: [
            "Diferencia",
            num(closure.differenceUsd).toFixed(2),
            num(closure.differenceBs).toFixed(2),
          ],
        },
      ],
      totals: Object.keys(snap).length
        ? [
            {
              label: "Notas / snapshot (sin costos sensibles)",
              value: JSON.stringify(snap).slice(0, 280),
            },
          ]
        : undefined,
    });

    const buf = await pdfToBuffer(doc);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cierre-${closure.id.slice(0, 8)}.pdf"`,
    );
    res.send(buf);
  } catch (err) {
    next(err);
  }
});
