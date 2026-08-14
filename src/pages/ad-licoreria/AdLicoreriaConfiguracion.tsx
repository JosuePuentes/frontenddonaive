import { useState } from "react";
import { AD_LICORERIA_MEDIA, adLicoreriaBrand } from "@/content/ad-licoreria/brand";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaConfiguracion() {
  const { warehouses, settings, operators, updateSettings } = useAdLicoreria();
  const [rate, setRate] = useState(settings.exchangeRateUsdToBs);
  const [suggest, setSuggest] = useState(settings.suggestBsFromRate);
  const [msg, setMsg] = useState("");

  function save() {
    const r = updateSettings({
      exchangeRateUsdToBs: rate,
      suggestBsFromRate: suggest,
    });
    setMsg(r.ok ? "Configuración guardada (mock local)" : r.error);
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Configuración del portal. Backend y dominio propio se conectan después.
      </p>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Identidad</h2>
        <p>
          {adLicoreriaBrand.name} — {adLicoreriaBrand.tagline}
        </p>
        <p className="text-sm text-[var(--ad-muted)]">
          Logo oficial: <code>{AD_LICORERIA_MEDIA.logo}</code>
        </p>
        <p className="text-xs text-[var(--ad-muted)]">
          Coloque el archivo del propietario en{" "}
          <code>public/ad-licoreria/logo/oficial.png</code>. No inventar logo.
        </p>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Tasa de cambio (referencia)</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          No fuerza el precio Bs de cada presentación; solo sugiere al editar.
        </p>
        <input
          className="ad-input max-w-xs"
          type="number"
          min={0}
          step="0.01"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
        <label className="flex items-center gap-2 text-sm text-[var(--ad-muted)]">
          <input
            type="checkbox"
            checked={suggest}
            onChange={(e) => setSuggest(e.target.checked)}
          />
          Sugerir Bs = USD × tasa al crear presentaciones
        </label>
        <button type="button" className="ad-btn ad-btn--gold" onClick={save}>
          Guardar
        </button>
        {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Roles operativos (UI)</h2>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          {operators.map((o) => (
            <li key={o.id}>
              {o.name} · <span className="text-[var(--ad-gold-soft)]">{o.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Depósitos</h2>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          {warehouses.map((w) => (
            <li key={w.id}>
              {w.name} ({w.code}) · {w.kind}
            </li>
          ))}
        </ul>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Dominio futuro</h2>
        <ul className="space-y-1 text-sm text-[var(--ad-muted)]">
          <li>
            Namespace actual: <code>/licoreria</code>
          </li>
          <li>
            Prep. hostname: <code>isAdLicoreriaHost()</code> (sin DNS real)
          </li>
          <li>
            Dev: <code>VITE_AD_LICORERIA_HOST=true</code>
          </li>
        </ul>
      </section>
    </div>
  );
}
