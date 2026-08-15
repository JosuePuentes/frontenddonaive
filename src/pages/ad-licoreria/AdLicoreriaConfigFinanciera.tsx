import { useEffect, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adFinanceClient } from "@/services/ad-licoreria/finance-client";

export default function AdLicoreriaConfigFinanciera() {
  const { hasPermission } = useAdLicoreria();
  const [hotkey, setHotkey] = useState("Control+x");
  const [criticalUtil, setCriticalUtil] = useState(5);
  const [criticalDays, setCriticalDays] = useState(3);
  const [warnDays, setWarnDays] = useState(7);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void (async () => {
      const r = await adFinanceClient.getSettings();
      if (r.ok) {
        const d = r.data as {
          parallelRateHotkey: string;
          pricingCriticalUtilityPercent?: number;
          inventoryCriticalCoverageDays?: number;
          inventoryWarnCoverageDays?: number;
        };
        setHotkey(d.parallelRateHotkey);
        if (d.pricingCriticalUtilityPercent != null) {
          setCriticalUtil(Number(d.pricingCriticalUtilityPercent));
        }
        if (d.inventoryCriticalCoverageDays != null) {
          setCriticalDays(d.inventoryCriticalCoverageDays);
        }
        if (d.inventoryWarnCoverageDays != null) {
          setWarnDays(d.inventoryWarnCoverageDays);
        }
      }
    })();
  }, []);

  async function save() {
    if (!hasPermission("finance.manage")) {
      setMsg("Sin permiso");
      return;
    }
    const r = await adFinanceClient.updateSettings({
      parallelRateHotkey: hotkey,
      pricingCriticalUtilityPercent: criticalUtil,
      inventoryCriticalCoverageDays: criticalDays,
      inventoryWarnCoverageDays: warnDays,
    });
    setMsg(r.ok ? "Guardado" : r.error);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Configuración financiera</h1>
      <section className="ad-panel space-y-2">
        <h2 className="font-medium">Atajo tasa paralela (privada)</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          No se muestra en POS ni dashboards. Solo operadores autorizados.
        </p>
        <input
          className="ad-input"
          value={hotkey}
          onChange={(e) => setHotkey(e.target.value)}
          placeholder="Control+x"
        />
      </section>
      <section className="ad-panel grid gap-2 sm:grid-cols-3">
        <h2 className="sm:col-span-3 font-medium">Umbrales zona crítica</h2>
        <label className="text-sm">
          Utilidad crítica (%)
          <input
            className="ad-input mt-1 block w-full"
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={criticalUtil}
            onChange={(e) => setCriticalUtil(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          Cobertura crítica (días)
          <input
            className="ad-input mt-1 block w-full"
            type="number"
            min={0}
            value={criticalDays}
            onChange={(e) => setCriticalDays(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          Cobertura advertencia (días)
          <input
            className="ad-input mt-1 block w-full"
            type="number"
            min={0}
            value={warnDays}
            onChange={(e) => setWarnDays(Number(e.target.value))}
          />
        </label>
        <button type="button" className="ad-btn" onClick={() => void save()}>
          Guardar
        </button>
      </section>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
