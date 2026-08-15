/**
 * Exportación documental A&D.
 * PDF tipográfico real vía API (`GET /documents/.../pdf` con pdfkit).
 * Fallback FE: HTML + window.print() / Guardar como PDF.
 */
import { API_BASE_URL } from "@/config/api";
import { getAdSessionHeaders, loadAdSession } from "@/services/ad-licoreria/session";

export function printDocumentElement(elementId: string, title = "Documento A&D") {
  const node = document.getElementById(elementId);
  if (!node) return { ok: false as const, mode: "none" as const, reason: "Elemento no encontrado" };
  const w = window.open("", "_blank", "noopener,noreferrer,width=720,height=900");
  if (!w) {
    return {
      ok: false as const,
      mode: "none" as const,
      reason: "El navegador bloqueó la ventana de impresión",
    };
  }
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body{font-family:Georgia,"Times New Roman",serif;color:#111;padding:28px;max-width:720px;margin:0 auto}
      h1{font-size:1.35rem;margin:0 0 .35rem}
      .muted{color:#555;font-size:.8rem}
      table{width:100%;border-collapse:collapse;margin:14px 0;font-size:.85rem}
      th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left}
      .right{text-align:right}
      @media print{button{display:none}}
    </style></head><body>${node.innerHTML}
    <p class="muted">A&D Licorería · impresión / Guardar como PDF</p>
    <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
  return { ok: true as const, mode: "print-html" as const };
}

async function downloadAdPdf(
  path: string,
  filename: string,
  token?: string,
  apiBase = API_BASE_URL,
) {
  const base = apiBase?.replace(/\/+$/, "");
  if (!base) throw new Error("VITE_API_BASE_URL no configurada");
  const auth =
    token != null
      ? { Authorization: `Bearer ${token}` }
      : getAdSessionHeaders();
  const res = await fetch(`${base}${path}`, {
    headers: { ...auth, Accept: "application/pdf" },
  });
  if (!res.ok) throw new Error(`PDF HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return { ok: true as const, mode: "api-pdf" as const };
}

export async function downloadPurchasePdf(
  purchaseId: string,
  token?: string,
  apiBase?: string,
) {
  return downloadAdPdf(
    `/api/v1/ad/documents/purchases/${purchaseId}/pdf`,
    `compra-${purchaseId}.pdf`,
    token,
    apiBase,
  );
}

export async function downloadTransferPdf(transferId: string) {
  return downloadAdPdf(
    `/api/v1/ad/documents/transfers/${transferId}/pdf`,
    `transferencia-${transferId}.pdf`,
  );
}

export async function downloadReceiptPdf(saleIdOrNumber: string) {
  return downloadAdPdf(
    `/api/v1/ad/documents/receipts/${encodeURIComponent(saleIdOrNumber)}/pdf`,
    `recibo-${saleIdOrNumber}.pdf`,
  );
}

export async function downloadClosurePdf(closureId: string) {
  return downloadAdPdf(
    `/api/v1/ad/documents/closures/${closureId}/pdf`,
    `cierre-${closureId}.pdf`,
  );
}

/** Abre PDF en pestaña nueva (previsualizar / imprimir). */
export async function previewAdPdf(path: string) {
  const base = API_BASE_URL?.replace(/\/+$/, "");
  if (!base) throw new Error("VITE_API_BASE_URL no configurada");
  const res = await fetch(`${base}${path}`, {
    headers: { ...getAdSessionHeaders(), Accept: "application/pdf" },
  });
  if (!res.ok) throw new Error(`PDF HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  return { ok: true as const, mode: "api-pdf-preview" as const };
}

export function currentAdToken(): string | null {
  return loadAdSession()?.accessToken ?? null;
}

export const AD_PDF_EXPORT_STATUS = {
  available: true,
  apiPaths: [
    "/api/v1/ad/documents/purchases/:id/pdf",
    "/api/v1/ad/documents/purchase-orders/:id/pdf",
    "/api/v1/ad/documents/transfers/:id/pdf",
    "/api/v1/ad/documents/receipts/:id/pdf",
    "/api/v1/ad/documents/closures/:id/pdf",
  ],
  fallback: "print-html",
  note: "PDF real vía pdfkit en API; FE puede previsualizar, imprimir o descargar. Sin utilidad/margen/tasa paralela.",
} as const;
