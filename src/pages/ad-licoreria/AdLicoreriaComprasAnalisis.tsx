import { useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";

export default function AdLicoreriaComprasAnalisis() {
  const { hasPermission } = useAdLicoreria();
  const [coverageDays, setCoverageDays] = useState(7);
  const [analysis, setAnalysis] = useState<unknown[]>([]);
  const [suggestions, setSuggestions] = useState<unknown[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    if (!hasPermission("purchase-analysis.view")) {
      setMsg("Sin permiso purchase-analysis.view");
      return;
    }
    const a = await adCommerceClient.analysis();
    const s = await adCommerceClient.replenishment(coverageDays);
    if (!a.ok) setMsg(a.error);
    else setAnalysis(a.data);
    if (!s.ok) setMsg(s.error);
    else setSuggestions(s.data);
  }

  async function createPo() {
    const lines = (suggestions as { productId: string; presentationId?: string; suggestedQtyBase: number }[])
      .filter((s) => s.suggestedQtyBase > 0)
      .slice(0, 20)
      .map((s) => ({
        productId: s.productId,
        presentationId: s.presentationId,
        suggestedQtyBase: s.suggestedQtyBase,
        qtyBase: s.suggestedQtyBase,
      }));
    if (!lines.length) {
      setMsg("No hay sugerencias para OC");
      return;
    }
    const r = await adCommerceClient.createPurchaseOrder({
      coverageDays,
      preliminary: true,
      lines,
    });
    setMsg(r.ok ? `OC ${(r.data as { documentNumber: string }).documentNumber}` : r.error);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Análisis de compras / reposición</h1>
      <section className="ad-panel flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Cobertura (días)
          <input
            className="ad-input mt-1"
            type="number"
            value={coverageDays}
            onChange={(e) => setCoverageDays(Number(e.target.value))}
          />
        </label>
        <button type="button" className="ad-btn" onClick={() => void load()}>
          Calcular
        </button>
        <button type="button" className="ad-btn" onClick={() => void createPo()}>
          Generar OC preliminar
        </button>
      </section>
      {msg && <p className="text-sm">{msg}</p>}
      <section className="ad-panel">
        <h2 className="mb-2 font-medium">Sugerencias</h2>
        <pre className="overflow-auto text-xs">{JSON.stringify(suggestions, null, 2)}</pre>
      </section>
      <section className="ad-panel">
        <h2 className="mb-2 font-medium">Por proveedor / producto</h2>
        <pre className="overflow-auto text-xs">{JSON.stringify(analysis, null, 2)}</pre>
      </section>
    </div>
  );
}
