import { useEffect, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";
import { adFinanceClient } from "@/services/ad-licoreria/finance-client";

/**
 * Tasas F7: BCV visible + historial.
 * Tasa paralela privada solo con permiso + atajo configurable (no se nombra en UI pública).
 */
export default function AdLicoreriaTasas() {
  const { hasPermission } = useAdLicoreria();
  const [bcv, setBcv] = useState(772.54);
  const [history, setHistory] = useState<
    { rate: number; effectiveAt: string; operatorId?: string | null }[]
  >([]);
  const [protectedRate, setProtectedRate] = useState(870);
  const [prevProtected, setPrevProtected] = useState<number | null>(null);
  const [showProtected, setShowProtected] = useState(false);
  const [hotkey, setHotkey] = useState("Control+x");
  const [msg, setMsg] = useState("");

  const canParallel =
    hasPermission("finance.parallel_rate") ||
    hasPermission("rates.protected.manage");

  useEffect(() => {
    void (async () => {
      const r = await adCommerceClient.getBcv();
      if (r.ok) {
        const d = r.data as {
          current?: { rate: number };
          history?: { rate: number; effectiveAt: string; operatorId?: string }[];
        };
        if (d.current?.rate) setBcv(d.current.rate);
        if (d.history) setHistory(d.history);
      }
      const s = await adFinanceClient.getSettings();
      if (s.ok) setHotkey(s.data.parallelRateHotkey || "Control+x");
      if (canParallel) {
        const p = await adCommerceClient.getProtected();
        if (p.ok) {
          const cur = (p.data as { current?: { rate: number } })?.current?.rate;
          if (cur) {
            setProtectedRate(cur);
            setPrevProtected(cur);
          }
        }
      }
    })();
  }, [canParallel]);

  useEffect(() => {
    if (!canParallel) return;
    function onKey(e: KeyboardEvent) {
      const parts = hotkey.toLowerCase().split("+").map((x) => x.trim());
      const wantCtrl = parts.includes("control") || parts.includes("ctrl");
      const wantMeta = parts.includes("meta") || parts.includes("cmd");
      const wantAlt = parts.includes("alt");
      const key = parts[parts.length - 1];
      if (wantCtrl && !e.ctrlKey) return;
      if (wantMeta && !e.metaKey) return;
      if (wantAlt && !e.altKey) return;
      if (e.key.toLowerCase() !== key) return;
      e.preventDefault();
      setShowProtected(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canParallel, hotkey]);

  async function saveBcv() {
    if (!hasPermission("rates.bcv.manage") && !hasPermission("finance.rates")) {
      setMsg("Sin permiso de tasas BCV");
      return;
    }
    const r = await adCommerceClient.setBcv(bcv, "UI tasas");
    setMsg(r.ok ? "BCV actualizada" : r.error);
    if (r.ok) {
      const h = await adCommerceClient.getBcv();
      if (h.ok) {
        const d = h.data as {
          history?: { rate: number; effectiveAt: string; operatorId?: string }[];
        };
        if (d.history) setHistory(d.history);
      }
    }
  }

  async function saveProtected() {
    if (!canParallel) {
      setMsg("Sin permiso");
      return;
    }
    const r = await adCommerceClient.setProtected(
      protectedRate,
      "UI referencia privada",
    );
    setMsg(r.ok ? "Referencia privada actualizada" : r.error);
    if (r.ok) {
      setPrevProtected(protectedRate);
      setShowProtected(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Tasas</h1>
      <section className="ad-panel space-y-2">
        <h2 className="font-medium">Tasa BCV (visible)</h2>
        <input
          className="ad-input"
          type="number"
          step="0.0001"
          value={bcv}
          onChange={(e) => setBcv(Number(e.target.value))}
        />
        <button type="button" className="ad-btn" onClick={() => void saveBcv()}>
          Guardar BCV
        </button>
        <div className="mt-3">
          <h3 className="text-sm font-medium">Historial</h3>
          <ul className="mt-1 max-h-40 space-y-1 overflow-auto text-xs text-[var(--ad-muted)]">
            {history.map((h, i) => (
              <li key={`${h.effectiveAt}-${i}`}>
                {h.rate} · {new Date(h.effectiveAt).toLocaleString("es-VE")}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {canParallel && (
        <section className="ad-panel space-y-2">
          <p className="text-sm text-[var(--ad-muted)]">
            Atajo privado: <kbd>{hotkey}</kbd>
          </p>
          <button
            type="button"
            className="ad-btn"
            onClick={() => setShowProtected(true)}
          >
            Abrir referencia privada
          </button>
        </section>
      )}

      {showProtected && canParallel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ad-panel w-full max-w-md space-y-3">
            <h2 className="font-medium">Referencia privada</h2>
            <p className="text-xs text-[var(--ad-muted)]">
              Anterior: {prevProtected ?? "—"} · Usuario autenticado ·{" "}
              {new Date().toLocaleString("es-VE")}
            </p>
            <input
              className="ad-input"
              type="number"
              step="0.0001"
              value={protectedRate}
              onChange={(e) => setProtectedRate(Number(e.target.value))}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="ad-btn"
                onClick={() => void saveProtected()}
              >
                Guardar
              </button>
              <button
                type="button"
                className="ad-btn"
                onClick={() => setShowProtected(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
