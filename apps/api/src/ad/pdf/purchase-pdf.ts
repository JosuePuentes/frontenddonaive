/**
 * Generación PDF tipográfica (pdfkit) — sin utilidad/margen/tasa paralela.
 */
import PDFDocument from "pdfkit";
import type { Readable } from "node:stream";

export type PurchasePdfInput = {
  brandName?: string;
  documentTitle: string;
  invoiceNumber: string;
  status: string;
  supplierName: string;
  warehouseName: string;
  invoiceDate?: string | null;
  currency: string;
  paymentMethodName?: string | null;
  paymentCondition: string;
  creditDays?: number | null;
  dueDate?: string | null;
  lines: {
    code?: string | null;
    description: string;
    brand?: string | null;
    presentation: string;
    qty: number;
    qtyBonus?: number;
    unitCost: number;
    presentationCost: number;
    lineTotal: number;
    taxable?: boolean;
  }[];
  subtotal: number;
  tax: number;
  grandTotal: number;
};

function money(n: number, currency: string) {
  return `${currency} ${n.toFixed(2)}`;
}

export function buildPurchasePdf(input: PurchasePdfInput): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 48, size: "LETTER" });
  const brand = input.brandName ?? "A&D Licorería & Bodegón";

  doc.fontSize(16).text(brand, { align: "left" });
  doc.fontSize(11).fillColor("#444").text(input.documentTitle);
  doc.moveDown(0.5);
  doc.fillColor("#000").fontSize(10);
  doc.text(`Factura / Doc: ${input.invoiceNumber}`);
  doc.text(`Estado: ${input.status}`);
  doc.text(`Proveedor: ${input.supplierName}`);
  doc.text(`Depósito: ${input.warehouseName}`);
  if (input.invoiceDate) doc.text(`Fecha: ${input.invoiceDate}`);
  doc.text(`Moneda: ${input.currency}`);
  doc.text(`Condición: ${input.paymentCondition}`);
  if (input.paymentMethodName) doc.text(`Método: ${input.paymentMethodName}`);
  if (input.creditDays != null) doc.text(`Días crédito: ${input.creditDays}`);
  if (input.dueDate) doc.text(`Vencimiento: ${input.dueDate}`);
  doc.moveDown();

  doc.fontSize(9).text(
    "Código | Descripción | Marca | Pres. | Qty | Bonus | C.unit | C.pres | Total",
  );
  doc.moveTo(48, doc.y).lineTo(564, doc.y).stroke();
  doc.moveDown(0.3);

  for (const l of input.lines) {
    const row = [
      l.code ?? "—",
      l.description.slice(0, 28),
      (l.brand ?? "—").slice(0, 12),
      l.presentation.slice(0, 10),
      String(l.qty),
      String(l.qtyBonus ?? 0),
      l.unitCost.toFixed(4),
      l.presentationCost.toFixed(2),
      l.lineTotal.toFixed(2),
    ].join(" | ");
    doc.text(row, { width: 516 });
  }

  doc.moveDown();
  doc.fontSize(10);
  doc.text(`Subtotal: ${money(input.subtotal, input.currency)}`);
  doc.text(`IVA: ${money(input.tax, input.currency)}`);
  doc.fontSize(12).text(`Total general: ${money(input.grandTotal, input.currency)}`);
  doc.moveDown();
  doc
    .fontSize(8)
    .fillColor("#666")
    .text(
      "Documento operativo. No incluye utilidad, margen, PVP ni tasa paralela.",
    );

  return doc;
}

export async function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export function streamPdf(doc: PDFKit.PDFDocument): Readable {
  doc.end();
  return doc as unknown as Readable;
}
