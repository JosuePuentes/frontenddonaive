import { useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";

/** Importación → validación → preview → confirmar (sin insertar directo). */
export default function AdLicoreriaImportacion() {
  const { hasPermission } = useAdLicoreria();
  const [raw, setRaw] = useState(
    `code,barcode,description,brand,presentation,unitsPerPresentation,unitCost,currency
DEMO-001,,Producto demo F5,Marca,Unidad,1,1.25,USD`,
  );
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [msg, setMsg] = useState("");

  function parseCsv(text: string) {
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cols = line.split(",");
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (cols[i] ?? "").trim();
      });
      return {
        code: row.code,
        barcode: row.barcode || undefined,
        description: row.description,
        brand: row.brand,
        presentation: row.presentation,
        unitsPerPresentation: Number(row.unitsPerPresentation || 1),
        unitCost: Number(row.unitCost || 0),
        currency: (row.currency as "USD" | "BS") || "USD",
      };
    });
  }

  async function runPreview() {
    if (!hasPermission("products.manage")) {
      setMsg("Sin permiso products.manage");
      return;
    }
    const rows = parseCsv(raw);
    const r = await adCommerceClient.importPreview(rows);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setPreview(r.data as Record<string, unknown>);
    setMsg("Preview listo — revise antes de confirmar");
  }

  async function confirm() {
    const batchId = preview?.batchId as string | undefined;
    if (!batchId) {
      setMsg("Genere preview primero");
      return;
    }
    const r = await adCommerceClient.importConfirm(batchId);
    setMsg(r.ok ? `Confirmado: ${JSON.stringify(r.data)}` : r.error);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Importación de productos</h1>
      <p className="text-sm text-[var(--ad-muted)]">
        Flujo: IMPORTACIÓN → VALIDACIÓN → PREVISUALIZACIÓN → CONFIRMAR.
      </p>
      <textarea
        className="ad-input min-h-40 font-mono text-xs"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      <div className="flex gap-2">
        <button type="button" className="ad-btn" onClick={() => void runPreview()}>
          Validar / Preview
        </button>
        <button type="button" className="ad-btn" onClick={() => void confirm()}>
          Confirmar
        </button>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      {preview && (
        <pre className="ad-panel overflow-auto text-xs">
          {JSON.stringify(preview, null, 2)}
        </pre>
      )}
    </div>
  );
}
