import { useEffect, useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { adFinanceClient } from "@/services/ad-licoreria/finance-client";

export default function AdLicoreriaConfigFinanciera() {
  const { hasPermission } = useAdLicoreria();
  const [hotkey, setHotkey] = useState("Control+x");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void (async () => {
      const r = await adFinanceClient.getSettings();
      if (r.ok) setHotkey(r.data.parallelRateHotkey);
    })();
  }, []);

  async function save() {
    if (!hasPermission("finance.manage")) {
      setMsg("Sin permiso");
      return;
    }
    const r = await adFinanceClient.updateSettings({
      parallelRateHotkey: hotkey,
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
        <button type="button" className="ad-btn" onClick={() => void save()}>
          Guardar
        </button>
      </section>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  );
}
