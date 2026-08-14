import { useState } from "react";
import { AD_LICORERIA_MEDIA, adLicoreriaBrand } from "@/content/ad-licoreria/brand";
import { AD_ROLE_PERMISSIONS } from "@/types/ad-licoreria";
import { uid } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type {
  AdPaymentMethodCode,
  AdPaymentMethodConfig,
  MoneyCurrency,
} from "@/types/ad-licoreria";
import { adWhatsAppService } from "@/services/ad-licoreria/whatsapp";

const CODES: AdPaymentMethodCode[] = [
  "efectivo_usd",
  "efectivo_bs",
  "pago_movil",
  "transferencia",
  "zelle",
  "tarjeta",
  "qr",
  "otro",
];

export default function AdLicoreriaConfiguracion() {
  const {
    warehouses,
    settings,
    operators,
    paymentMethods,
    whatsappLogs,
    updateSettings,
    upsertPaymentMethod,
  } = useAdLicoreria();

  const [rate, setRate] = useState(settings.exchangeRateUsdToBs);
  const [suggest, setSuggest] = useState(settings.suggestBsFromRate);
  const [waEnabled, setWaEnabled] = useState(settings.whatsappEnabled);
  const [msg, setMsg] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [pmName, setPmName] = useState("");
  const [pmCode, setPmCode] = useState<AdPaymentMethodCode>("otro");
  const [pmCurrency, setPmCurrency] = useState<MoneyCurrency>("USD");
  const [pmActive, setPmActive] = useState(true);
  const [pmRef, setPmRef] = useState(false);
  const [pmVoucher, setPmVoucher] = useState(false);
  const [pmBank, setPmBank] = useState(false);
  const [pmNotes, setPmNotes] = useState("");

  function saveSettings() {
    const r = updateSettings({
      exchangeRateUsdToBs: rate,
      suggestBsFromRate: suggest,
      whatsappEnabled: waEnabled,
    });
    setMsg(r.ok ? "Configuración guardada (mock local)" : r.error);
  }

  function loadMethod(m: AdPaymentMethodConfig) {
    setEditId(m.id);
    setPmName(m.name);
    setPmCode(m.code);
    setPmCurrency(m.currency);
    setPmActive(m.active);
    setPmRef(m.requiresReference);
    setPmVoucher(m.requiresVoucher);
    setPmBank(m.requiresBank);
    setPmNotes(m.notes ?? "");
  }

  function saveMethod() {
    if (!pmName.trim()) {
      setMsg("Nombre del método obligatorio");
      return;
    }
    const method: AdPaymentMethodConfig = {
      id: editId ?? uid("pm"),
      name: pmName.trim(),
      code: pmCode,
      currency: pmCurrency,
      active: pmActive,
      requiresReference: pmRef,
      requiresVoucher: pmVoucher,
      requiresBank: pmBank,
      notes: pmNotes.trim() || undefined,
    };
    const r = upsertPaymentMethod(method);
    setMsg(r.ok ? `Método ${method.name} guardado` : r.error);
    if (r.ok) {
      setEditId(null);
      setPmName("");
      setPmNotes("");
    }
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Configuración operativa: tasa de referencia, métodos de pago, roles y
        WhatsApp mock.
      </p>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Identidad</h2>
        <p>
          {adLicoreriaBrand.name} — {adLicoreriaBrand.tagline}
        </p>
        <p className="text-sm text-[var(--ad-muted)]">
          Logo oficial: <code>{AD_LICORERIA_MEDIA.logo}</code>
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
        <label className="flex items-center gap-2 text-sm text-[var(--ad-muted)]">
          <input
            type="checkbox"
            checked={waEnabled}
            onChange={(e) => setWaEnabled(e.target.checked)}
          />
          WhatsApp mock habilitado (sin envío real)
        </label>
        <button type="button" className="ad-btn ad-btn--gold" onClick={saveSettings}>
          Guardar
        </button>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Métodos de pago</h2>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Moneda</th>
                <th>Ref</th>
                <th>Banco</th>
                <th>Comp.</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.code}</td>
                  <td>{m.currency}</td>
                  <td>{m.requiresReference ? "Sí" : "—"}</td>
                  <td>{m.requiresBank ? "Sí" : "—"}</td>
                  <td>{m.requiresVoucher ? "Sí" : "—"}</td>
                  <td>
                    <span className="ad-badge">
                      {m.active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={() => loadMethod(m)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="ad-input"
            placeholder="Nombre"
            value={pmName}
            onChange={(e) => setPmName(e.target.value)}
          />
          <select
            className="ad-select"
            value={pmCode}
            onChange={(e) => setPmCode(e.target.value as AdPaymentMethodCode)}
          >
            {CODES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={pmCurrency}
            onChange={(e) => setPmCurrency(e.target.value as MoneyCurrency)}
          >
            <option value="USD">USD</option>
            <option value="BS">Bs</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-[var(--ad-muted)]">
            <input
              type="checkbox"
              checked={pmActive}
              onChange={(e) => setPmActive(e.target.checked)}
            />
            Activo
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--ad-muted)]">
            <input
              type="checkbox"
              checked={pmRef}
              onChange={(e) => setPmRef(e.target.checked)}
            />
            Requiere referencia
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--ad-muted)]">
            <input
              type="checkbox"
              checked={pmBank}
              onChange={(e) => setPmBank(e.target.checked)}
            />
            Requiere banco
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--ad-muted)]">
            <input
              type="checkbox"
              checked={pmVoucher}
              onChange={(e) => setPmVoucher(e.target.checked)}
            />
            Requiere comprobante
          </label>
          <input
            className="ad-input sm:col-span-2"
            placeholder="Observaciones"
            value={pmNotes}
            onChange={(e) => setPmNotes(e.target.value)}
          />
          <button type="button" className="ad-btn ad-btn--gold" onClick={saveMethod}>
            {editId ? "Actualizar método" : "Crear método"}
          </button>
        </div>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Roles y permisos (UI)</h2>
        <ul className="space-y-2 text-sm text-[var(--ad-muted)]">
          {operators.map((o) => (
            <li key={o.id}>
              <span className="text-[var(--ad-gold-soft)]">{o.name}</span> ·{" "}
              {o.role} ·{" "}
              {AD_ROLE_PERMISSIONS[o.role].join(", ")}
            </li>
          ))}
        </ul>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">WhatsApp mock</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          Templates:{" "}
          {adWhatsAppService
            .getTemplates()
            .map((t) => t.code)
            .join(", ")}
        </p>
        <ul className="max-h-40 space-y-1 overflow-auto text-sm text-[var(--ad-muted)]">
          {whatsappLogs.slice(0, 10).map((w) => (
            <li key={w.id}>
              {w.status} · {w.template} · {w.toPhone} ·{" "}
              {new Date(w.createdAt).toLocaleString("es-VE")}
            </li>
          ))}
          {!whatsappLogs.length ? <li>Sin mensajes aún</li> : null}
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

      {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
    </div>
  );
}
