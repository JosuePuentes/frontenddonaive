/**
 * PDFs operativos A&D (transferencias, recibos, cierres).
 * Nunca incluye utilidad, margen ni tasa paralela.
 */
import PDFDocument from "pdfkit";

export type OperationalPdfRow = {
  cells: string[];
};

export type OperationalPdfInput = {
  brandName?: string;
  documentTitle: string;
  subtitle?: string;
  meta: { label: string; value: string }[];
  tableHeaders: string[];
  rows: OperationalPdfRow[];
  totals?: { label: string; value: string }[];
  footerNote?: string;
};

export function buildOperationalPdf(
  input: OperationalPdfInput,
): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: 48, size: "LETTER" });
  const brand = input.brandName ?? "A&D Licorería & Bodegón";

  doc.fontSize(16).fillColor("#000").text(brand, { align: "left" });
  doc.fontSize(11).fillColor("#444").text(input.documentTitle);
  if (input.subtitle) {
    doc.fontSize(9).fillColor("#666").text(input.subtitle);
  }
  doc.moveDown(0.5);
  doc.fillColor("#000").fontSize(10);
  for (const m of input.meta) {
    doc.text(`${m.label}: ${m.value}`);
  }
  doc.moveDown();

  if (input.tableHeaders.length) {
    doc
      .fontSize(9)
      .text(input.tableHeaders.join(" | "), { width: 516 });
    doc.moveTo(48, doc.y).lineTo(564, doc.y).stroke();
    doc.moveDown(0.3);
  }

  for (const row of input.rows) {
    doc.fontSize(9).text(row.cells.join(" | "), { width: 516 });
  }

  if (input.totals?.length) {
    doc.moveDown();
    doc.fontSize(10);
    for (const t of input.totals) {
      doc.text(`${t.label}: ${t.value}`);
    }
  }

  doc.moveDown();
  doc
    .fontSize(8)
    .fillColor("#666")
    .text(
      input.footerNote ??
        "Documento operativo. No incluye utilidad, margen, PVP ni tasa paralela.",
    );

  return doc;
}
