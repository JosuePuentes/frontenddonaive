import { useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adCommerceClient } from "@/services/ad-licoreria/commerce-client";

/**
 * Configuración de tasas: BCV visible; tasa protegida solo con permiso
 * (modal/atajo — sin exponer en dashboards).
 */
export default function AdLicoreriaTasas() {
  const { hasPermission } = useAdLicoreria();
  const [bcv, setBcv] = useState(772.54);
  const [protectedRate, setProtectedRate] = useState(870);
  const [showProtected, setShowProtected] = useState(false);
  const [msg, setMsg] = useState("");

  async function saveBcv() {
    if (!hasPermission("rates.bcv.manage")) {
      setMsg("Sin permiso rates.bcv.manage");
      return;
    }
    const r = await adCommerceClient.setBcv(bcv, "UI config");
    setMsg(r.ok ? "BCV actualizada" : r.error);
  }

  async function saveProtected() {
    if (!hasPermission("rates.protected.manage")) {
      setMsg("Sin permiso");
      return;
    }
    const r = await adCommerceClient.setProtected(protectedRate, "UI protected");
    setMsg(r.ok ? "Tasa protegida actualizada" : r.error);
    setShowProtected(false);
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
      </section>

      {hasPermission("rates.protected.manage") && (
        <section className="ad-panel space-y-2">
          <button
            type="button"
            className="ad-btn"
            onClick={() => setShowProtected(true)}
          >
            Abrir referencia protegida
          </button>
        </section>
      )}

      {showProtected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ad-panel w-full max-w-md space-y-3">
            <h2 className="font-medium">Referencia protegida</h2>
            <input
              className="ad-input"
              type="number"
              step="0.0001"
              value={protectedRate}
              onChange={(e) => setProtectedRate(Number(e.target.value))}
            />
            <div className="flex gap-2">
              <button type="button" className="ad-btn" onClick={() => void saveProtected()}>
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
