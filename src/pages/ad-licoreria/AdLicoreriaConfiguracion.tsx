import { useState } from "react";
import { AD_LICORERIA_MEDIA, adLicoreriaBrand } from "@/content/ad-licoreria/brand";
import { AD_ROLE_PERMISSIONS, type AdOperator, type AdRole } from "@/types/ad-licoreria";
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

const ROLES: AdRole[] = ["admin", "cajero", "mesonera", "inventario"];

export default function AdLicoreriaConfiguracion() {
  const {
    warehouses,
    settings,
    operators,
    paymentMethods,
    whatsappLogs,
    updateSettings,
    upsertPaymentMethod,
    upsertWarehouse,
    upsertOperator,
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

  const [whId, setWhId] = useState(warehouses[0]?.id ?? "");
  const [whName, setWhName] = useState(warehouses[0]?.name ?? "");
  const [whCode, setWhCode] = useState(warehouses[0]?.code ?? "");

  const [opId, setOpId] = useState<string | null>(null);
  const [opName, setOpName] = useState("");
  const [opRole, setOpRole] = useState<AdRole>("cajero");
  const [opWh, setOpWh] = useState(warehouses[0]?.id ?? "");
  const [opPos, setOpPos] = useState(true);
  const [opActive, setOpActive] = useState(true);

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

  function loadWarehouse(id: string) {
    const w = warehouses.find((x) => x.id === id);
    if (!w) return;
    setWhId(w.id);
    setWhName(w.name);
    setWhCode(w.code);
  }

  function saveWarehouse() {
    const current = warehouses.find((w) => w.id === whId);
    if (!current) {
      setMsg("Seleccione un depósito");
      return;
    }
    const r = upsertWarehouse({
      ...current,
      name: whName,
      code: whCode,
    });
    setMsg(r.ok ? `Depósito «${r.data.name}» actualizado` : r.error);
  }

  function loadOperator(o: AdOperator) {
    setOpId(o.id);
    setOpName(o.name);
    setOpRole(o.role);
    setOpWh(o.warehouseId ?? "");
    setOpPos(o.posEnabled !== false);
    setOpActive(o.active);
  }

  function saveOperator() {
    const operator: AdOperator = {
      id: opId ?? uid("op"),
      name: opName,
      role: opRole,
      active: opActive,
      warehouseId: opWh || null,
      posEnabled: opPos,
    };
    const r = upsertOperator(operator);
    setMsg(r.ok ? `Usuario ${r.data.name} guardado` : r.error);
    if (r.ok) {
      setOpId(null);
      setOpName("");
    }
  }

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Configuración operativa: depósitos (nombres propios), usuarios por
        depósito, tasa, métodos de pago y WhatsApp mock.
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
        <h2 className="ad-panel-title">Depósitos (nombres)</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          Coloque el nombre real de cada depósito para identificarlos en POS,
          compras y transferencias.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="ad-select"
            value={whId}
            onChange={(e) => loadWarehouse(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
          <input
            className="ad-input"
            placeholder="Nombre visible"
            value={whName}
            onChange={(e) => setWhName(e.target.value)}
          />
          <input
            className="ad-input"
            placeholder="Código"
            value={whCode}
            onChange={(e) => setWhCode(e.target.value)}
          />
        </div>
        <button type="button" className="ad-btn ad-btn--gold" onClick={saveWarehouse}>
          Guardar depósito
        </button>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Usuarios por depósito</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          Cajero / mesonera con POS deben pertenecer a un solo depósito. Así no
          se mezclan las facturaciones.
        </p>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Depósito</th>
                <th>POS</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {operators.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.role}</td>
                  <td>
                    {o.warehouseId
                      ? warehouses.find((w) => w.id === o.warehouseId)?.name ??
                        o.warehouseId
                      : "— (transversal)"}
                  </td>
                  <td>{o.posEnabled === false ? "No" : "Sí"}</td>
                  <td>{o.active ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={() => loadOperator(o)}
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
            value={opName}
            onChange={(e) => setOpName(e.target.value)}
          />
          <select
            className="ad-select"
            value={opRole}
            onChange={(e) => setOpRole(e.target.value as AdRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="ad-select"
            value={opWh}
            onChange={(e) => setOpWh(e.target.value)}
          >
            <option value="">Sin depósito (admin/inventario)</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-[var(--ad-muted)]">
            <input
              type="checkbox"
              checked={opPos}
              onChange={(e) => setOpPos(e.target.checked)}
            />
            Acceso POS
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--ad-muted)]">
            <input
              type="checkbox"
              checked={opActive}
              onChange={(e) => setOpActive(e.target.checked)}
            />
            Activo
          </label>
          <button type="button" className="ad-btn ad-btn--gold" onClick={saveOperator}>
            {opId ? "Actualizar usuario" : "Crear usuario"}
          </button>
        </div>
        <ul className="space-y-1 text-xs text-[var(--ad-muted)]">
          {operators.map((o) => (
            <li key={`perm-${o.id}`}>
              {o.name}: {AD_ROLE_PERMISSIONS[o.role].join(", ")}
            </li>
          ))}
        </ul>
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

      {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
    </div>
  );
}
