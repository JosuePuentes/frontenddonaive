/**
 * Exportación documental A&D.
 * PDF tipográfico real NO está empaquetado (sin jspdf/pdfkit).
 * Fallback oficial: HTML + window.print() (el usuario puede “Guardar como PDF”).
 */
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
    <p class="muted">A&D Licorería · impresión / Guardar como PDF (fallback sin motor PDF embebido)</p>
    <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
  return { ok: true as const, mode: "print-html" as const };
}

export const AD_PDF_EXPORT_STATUS = {
  available: false,
  fallback: "print-html",
  note: "Sin dependencia PDF en package.json. Usar impresión del navegador / Guardar como PDF.",
} as const;
