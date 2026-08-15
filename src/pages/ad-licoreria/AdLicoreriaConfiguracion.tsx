import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_MEDIA, adLicoreriaBrand } from "@/content/ad-licoreria/brand";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { AD_ROLE_LABELS } from "@/lib/ad-licoreria/access";
import { uid } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type {
  AdPaymentMethodCode,
  AdPaymentMethodConfig,
  AdWarehouse,
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
    upsertWarehouse,
    createWarehouse,
    setWarehouseActive,
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
  const [whResponsible, setWhResponsible] = useState(
    warehouses[0]?.responsibleUserId ?? "",
  );
  const [newWhName, setNewWhName] = useState("");
  const [newWhCode, setNewWhCode] = useState("");

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
    setWhResponsible(w.responsibleUserId ?? "");
  }

  function saveWarehouse() {
    const current = warehouses.find((w) => w.id === whId);
    if (!current) {
      setMsg("Seleccione un depósito");
      return;
    }
    const patch: AdWarehouse = {
      ...current,
      name: whName.trim() || current.name,
      code: whCode.trim().toUpperCase() || current.code,
      responsibleUserId: whResponsible || null,
    };
    const r = upsertWarehouse(patch);
    setMsg(r.ok ? `Depósito «${r.data.name}» actualizado` : r.error);
  }

  function createNewWarehouse() {
    const r = createWarehouse({
      name: newWhName,
      code: newWhCode || undefined,
      userName: "Admin A&D",
    });
    setMsg(r.ok ? `Depósito creado: ${r.data.code} · ${r.data.name}` : r.error);
    if (r.ok) {
      setNewWhName("");
      setNewWhCode("");
      loadWarehouse(r.data.id);
    }
  }

  function toggleWarehouseActive() {
    const current = warehouses.find((w) => w.id === whId);
    if (!current) return;
    const r = setWarehouseActive({
      warehouseId: current.id,
      active: !current.active,
      userName: "Admin A&D",
    });
    setMsg(
      r.ok
        ? `Depósito ${r.data.name}: ${r.data.active ? "activo" : "inactivo"}`
        : r.error,
    );
  }

  const assignedUsers = operators.filter((o) => o.warehouseId === whId);
  const responsible = operators.find((o) => o.id === whResponsible);

  return (
    <div className="space-y-5">
      <p className="max-w-2xl text-sm text-[var(--ad-muted)]">
        Configuración operativa mock: depósitos, tasa, métodos de pago y
        WhatsApp. Usuarios y matriz de permisos tienen pantallas dedicadas.
      </p>

      <section className="ad-panel flex flex-wrap gap-2">
        <Link className="ad-btn ad-btn--gold" to={AD_LICORERIA_ROUTES.configUsuarios}>
          Usuarios
        </Link>
        <Link className="ad-btn ad-btn--gold" to={AD_LICORERIA_ROUTES.configDiseno}>
          Diseño web
        </Link>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configPermisos}>
          Matriz de permisos
        </Link>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.tv}>
          TV / Pantallas
        </Link>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.mesas}>
          Espacios / mesas
        </Link>
      </section>

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
        <h2 className="ad-panel-title">Depósitos</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          Nombres y códigos configurables (no hardcodeados en UI). Cada usuario
          operativo se ata a un depósito o queda transversal.
        </p>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Responsable</th>
                <th>Usuarios</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id}>
                  <td>{w.code}</td>
                  <td>{w.name}</td>
                  <td>
                    {operators.find((o) => o.id === w.responsibleUserId)?.name ??
                      "—"}
                  </td>
                  <td>
                    {
                      operators.filter((o) => o.warehouseId === w.id).length
                    }
                  </td>
                  <td>{w.active ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={() => loadWarehouse(w.id)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="ad-select"
            value={whId}
            onChange={(e) => loadWarehouse(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} · {w.name}
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
            placeholder="Código interno"
            value={whCode}
            onChange={(e) => setWhCode(e.target.value)}
          />
          <select
            className="ad-select"
            value={whResponsible}
            onChange={(e) => setWhResponsible(e.target.value)}
          >
            <option value="">Sin responsable</option>
            {operators.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({AD_ROLE_LABELS[o.role]})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ad-btn ad-btn--gold" onClick={saveWarehouse}>
            Guardar depósito
          </button>
          <button type="button" className="ad-btn" onClick={toggleWarehouseActive}>
            Activar / desactivar
          </button>
        </div>
        {whId ? (
          <div className="border border-[var(--ad-line)] p-3 text-sm text-[var(--ad-muted)]">
            <p>
              Código: <strong className="text-[var(--ad-text)]">{whCode}</strong>
            </p>
            <p>
              Responsable:{" "}
              <strong className="text-[var(--ad-text)]">
                {responsible?.name ?? "—"}
              </strong>
            </p>
            <p className="mt-2">Usuarios asignados:</p>
            <ul className="mt-1 space-y-1">
              {assignedUsers.map((o) => (
                <li key={o.id}>
                  {o.name} · {AD_ROLE_LABELS[o.role]} · POS{" "}
                  {o.posEnabled === false ? "No" : "Sí"}
                </li>
              ))}
              {!assignedUsers.length ? <li>Ninguno</li> : null}
            </ul>
          </div>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className="ad-input"
            placeholder="Nuevo nombre"
            value={newWhName}
            onChange={(e) => setNewWhName(e.target.value)}
          />
          <input
            className="ad-input"
            placeholder="Código (opcional WH-xxx)"
            value={newWhCode}
            onChange={(e) => setNewWhCode(e.target.value)}
          />
          <button
            type="button"
            className="ad-btn ad-btn--gold"
            onClick={createNewWarehouse}
          >
            Crear depósito
          </button>
        </div>
      </section>

      <section className="ad-panel space-y-2">
        <h2 className="ad-panel-title">Usuarios y roles</h2>
        <p className="text-sm text-[var(--ad-muted)]">
          Alta, edición, depósito asignado, acceso POS/inventario/COP y permisos
          personalizados.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            className="ad-btn ad-btn--gold"
            to={AD_LICORERIA_ROUTES.configUsuarios}
          >
            Abrir módulo de usuarios
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configPermisos}>
            Matriz de permisos
          </Link>
        </div>
        <ul className="space-y-1 text-xs text-[var(--ad-muted)]">
          {operators.slice(0, 8).map((o) => (
            <li key={o.id}>
              {o.username} · {o.name} · {AD_ROLE_LABELS[o.role]} ·{" "}
              {o.warehouseId
                ? warehouses.find((w) => w.id === o.warehouseId)?.name
                : "Transversal"}
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
