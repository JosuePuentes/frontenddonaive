import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  AD_DEFAULT_ROLE_PERMISSIONS,
  AD_ROLE_LABELS,
} from "@/lib/ad-licoreria/access";
import { uid } from "@/lib/ad-licoreria/conversions";
import {
  roleRequiresSingleWarehouse,
  warehouseAssignmentLabel,
  warehouseIdFromMode,
  warehouseModeFromId,
  type WarehouseAssignMode,
} from "@/lib/ad-licoreria/warehouses";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { resolveAdResult } from "@/services/ad-licoreria/async-result";
import { useAdTv } from "@/providers/ad-licoreria/AdTvProvider";
import type { AdOperator, AdRole } from "@/types/ad-licoreria";

const ROLES: AdRole[] = [
  "admin",
  "supervisor",
  "cajero",
  "mesonera",
  "inventario",
  "tv",
];

export default function AdLicoreriaConfigUsuarios() {
  const { operators, warehouses, upsertOperator, setCurrentOperator } =
    useAdLicoreria();
  const { screens, groups } = useAdTv();

  const [opId, setOpId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<AdRole>("cajero");
  const [warehouseMode, setWarehouseMode] = useState<WarehouseAssignMode>("lic");
  const [pos, setPos] = useState(true);
  const [inv, setInv] = useState(false);
  const [cop, setCop] = useState(false);
  const [purchase, setPurchase] = useState(false);
  const [closures, setClosures] = useState(true);
  const [active, setActive] = useState(true);
  const [tvScreenId, setTvScreenId] = useState("");
  const [tvGroupId, setTvGroupId] = useState("");
  const [msg, setMsg] = useState("");

  function load(o: AdOperator) {
    setOpId(o.id);
    setUsername(o.username);
    setPassword("");
    setPasswordConfirm("");
    setName(o.name);
    setPhone(o.phone ?? "");
    setRole(o.role);
    setWarehouseMode(warehouseModeFromId(o.warehouseId, warehouses));
    setPos(o.role === "tv" ? false : o.posEnabled !== false);
    setInv(o.inventoryAccess === true);
    setCop(o.copAccess === true);
    setPurchase(o.purchaseAccess === true);
    setClosures(o.closuresAccess !== false);
    setActive(o.active);
    setTvScreenId(o.tvScreenId ?? "");
    setTvGroupId(o.tvGroupId ?? "");
  }

  function onRoleChange(next: AdRole) {
    setRole(next);
    if (next === "tv") {
      setPos(false);
      setInv(false);
      setCop(false);
      setPurchase(false);
      setClosures(false);
      setWarehouseMode("transversal");
    } else if (roleRequiresSingleWarehouse(next)) {
      setWarehouseMode((m) => (m === "transversal" ? "lic" : m));
    }
  }

  function resetForm() {
    setOpId(null);
    setUsername("");
    setPassword("");
    setPasswordConfirm("");
    setName("");
    setPhone("");
    setTvScreenId("");
    setTvGroupId("");
    setRole("cajero");
    setWarehouseMode("lic");
    setPos(true);
    setInv(false);
    setCop(false);
    setPurchase(false);
    setClosures(true);
    setActive(true);
    setMsg("");
  }

  async function save() {
    const isTv = role === "tv";
    const singleWh = roleRequiresSingleWarehouse(role);
    if (singleWh && warehouseMode === "transversal") {
      setMsg("Cajero y mesonera deben asignarse a Licorería o Bodegón");
      return;
    }
    if (!isTv && pos && singleWh && warehouseMode === "transversal") {
      setMsg("Seleccione Licorería o Bodegón para el POS");
      return;
    }
    const resolvedWarehouseId = isTv
      ? null
      : warehouseIdFromMode(warehouseMode, warehouses);
    if (
      !isTv &&
      (singleWh || pos) &&
      !resolvedWarehouseId
    ) {
      setMsg("Seleccione Licorería o Bodegón");
      return;
    }
    const login = username.trim().toLowerCase();
    if (!login) {
      setMsg("Indique el usuario (login) con el que va a entrar");
      return;
    }
    if (!name.trim()) {
      setMsg("Indique el nombre del usuario");
      return;
    }
    const pwd = password.trim();
    if (!opId) {
      if (pwd.length < 6) {
        setMsg("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (pwd !== passwordConfirm.trim()) {
        setMsg("Las contraseñas no coinciden");
        return;
      }
    } else if (pwd) {
      if (pwd.length < 6) {
        setMsg("La contraseña debe tener al menos 6 caracteres");
        return;
      }
      if (pwd !== passwordConfirm.trim()) {
        setMsg("Las contraseñas no coinciden");
        return;
      }
    }
    const existing = opId
      ? operators.find((o) => o.id === opId)
      : undefined;
    const operator: AdOperator = {
      id: opId ?? uid("op"),
      username: login,
      password: pwd || undefined,
      name: name.trim(),
      phone: phone.trim() || undefined,
      role,
      active,
      warehouseId: resolvedWarehouseId,
      posEnabled: isTv ? false : pos,
      inventoryAccess: isTv ? false : inv,
      copAccess: isTv ? false : cop,
      purchaseAccess: isTv ? false : purchase,
      closuresAccess: isTv ? false : closures,
      mockCredential: pwd || existing?.mockCredential,
      tvScreenId: isTv ? tvScreenId || null : null,
      tvGroupId: isTv ? tvGroupId || null : null,
      customPermissions: isTv
        ? existing?.customPermissions?.length
          ? [...existing.customPermissions]
          : [...AD_DEFAULT_ROLE_PERMISSIONS.tv]
        : existing?.customPermissions,
      deniedPermissions: existing?.deniedPermissions,
    };
    /** Nuevo Administrador TV: permisos amplios del módulo. */
    if (
      isTv &&
      !existing &&
      (username === "tvadmin" ||
        name.toLowerCase().includes("administrador tv"))
    ) {
      operator.customPermissions = [
        "tv.view",
        "tv.manage",
        "tv.control",
        "tv.content.manage",
        "tv.groups.manage",
        "tv.screen.manage",
      ];
    }
    const r = await resolveAdResult(upsertOperator(operator));
    if (r.ok) {
      const savedUser = r.data.username;
      resetForm();
      setMsg(`Usuario ${savedUser} guardado`);
    } else {
      setMsg(r.error);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Configuración</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-[var(--ad-muted)]">
            Defina usuario, contraseña y depósito (Licorería, Bodegón o ambos).
            Cajero/mesonera deben ir a un solo depósito; Bodegón habilita mesas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configuracion}>
            ← Config
          </Link>
          <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configPermisos}>
            Permisos
          </Link>
        </div>
      </header>

      <section className="ad-panel">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Depósito / TV</th>
                <th>POS</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {operators.map((o) => (
                <tr key={o.id}>
                  <td>{o.username}</td>
                  <td>{o.name}</td>
                  <td>{AD_ROLE_LABELS[o.role]}</td>
                  <td>
                    {o.role === "tv"
                      ? [
                          o.tvScreenId
                            ? screens.find((s) => s.id === o.tvScreenId)?.code
                            : null,
                          o.tvGroupId
                            ? groups.find((g) => g.id === o.tvGroupId)?.name
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "TV"
                      : warehouseAssignmentLabel(o.warehouseId, warehouses)}
                  </td>
                  <td>{o.role === "tv" || o.posEnabled === false ? "No" : "Sí"}</td>
                  <td>{o.active ? "Activo" : "Inactivo"}</td>
                  <td className="space-x-1">
                    <button
                      type="button"
                      className="ad-btn"
                      onClick={() => load(o)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="ad-btn ad-btn--gold"
                      onClick={async () => {
                        const r = await resolveAdResult(
                          setCurrentOperator(o.id),
                        );
                        setMsg(
                          r.ok
                            ? `Sesión: ${o.name} · ${AD_ROLE_LABELS[o.role]}`
                            : r.error,
                        );
                      }}
                    >
                      Usar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">
          {opId ? "Editar usuario" : "Crear usuario"}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs">
            Usuario (login)
            <input
              className="ad-input mt-1"
              placeholder="ej. maria.caja"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
            />
          </label>
          <label className="text-xs">
            Contraseña {opId ? "(opcional)" : ""}
            <input
              className="ad-input mt-1"
              type="password"
              placeholder={
                opId
                  ? "Dejar vacía para no cambiar"
                  : "Mínimo 6 caracteres"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="text-xs">
            Confirmar contraseña
            <input
              className="ad-input mt-1"
              type="password"
              placeholder={
                opId ? "Solo si cambia la clave" : "Repita la contraseña"
              }
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="text-xs">
            Nombre
            <input
              className="ad-input mt-1"
              placeholder="Nombre visible"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Teléfono (opcional)
            <input
              className="ad-input mt-1"
              placeholder="0414-0000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="text-xs">
            Rol
            <select
              className="ad-select mt-1"
              value={role}
              onChange={(e) => onRoleChange(e.target.value as AdRole)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {AD_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          {role === "tv" ? (
            <>
              <select
                className="ad-select"
                value={tvScreenId}
                onChange={(e) => setTvScreenId(e.target.value)}
              >
                <option value="">Sin pantalla asignada</option>
                {screens.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
              <select
                className="ad-select"
                value={tvGroupId}
                onChange={(e) => setTvGroupId(e.target.value)}
              >
                <option value="">Sin grupo asignado</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <fieldset className="sm:col-span-2 lg:col-span-3 space-y-2 rounded border border-[var(--ad-line)] p-3">
              <legend className="px-1 text-sm font-medium text-[var(--ad-gold-soft)]">
                ¿Dónde opera este usuario?
              </legend>
              {roleRequiresSingleWarehouse(role) ? (
                <p className="text-xs text-[var(--ad-muted)]">
                  Cajero y mesonera trabajan en un solo depósito. En Bodegón
                  puede usar mesas; en Licorería es venta en mostrador.
                </p>
              ) : (
                <p className="text-xs text-[var(--ad-muted)]">
                  Admin, supervisor e inventario pueden ser transversales
                  (ambos) o quedar en un solo depósito.
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-3">
                {!roleRequiresSingleWarehouse(role) ? (
                  <label className="flex cursor-pointer items-start gap-2 rounded border border-[var(--ad-line)] p-2 text-sm has-[:checked]:border-[var(--ad-gold)]">
                    <input
                      type="radio"
                      name="warehouseMode"
                      className="mt-1"
                      checked={warehouseMode === "transversal"}
                      onChange={() => setWarehouseMode("transversal")}
                    />
                    <span>
                      <strong>Ambos</strong>
                      <span className="mt-0.5 block text-xs text-[var(--ad-muted)]">
                        Licorería + Bodegón
                      </span>
                    </span>
                  </label>
                ) : null}
                <label className="flex cursor-pointer items-start gap-2 rounded border border-[var(--ad-line)] p-2 text-sm has-[:checked]:border-[var(--ad-gold)]">
                  <input
                    type="radio"
                    name="warehouseMode"
                    className="mt-1"
                    checked={warehouseMode === "lic"}
                    onChange={() => setWarehouseMode("lic")}
                  />
                  <span>
                    <strong>Licorería</strong>
                    <span className="mt-0.5 block text-xs text-[var(--ad-muted)]">
                      Mostrador, sin mesas
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 rounded border border-[var(--ad-line)] p-2 text-sm has-[:checked]:border-[var(--ad-gold)]">
                  <input
                    type="radio"
                    name="warehouseMode"
                    className="mt-1"
                    checked={warehouseMode === "bod"}
                    onChange={() => setWarehouseMode("bod")}
                  />
                  <span>
                    <strong>Bodegón</strong>
                    <span className="mt-0.5 block text-xs text-[var(--ad-muted)]">
                      POS, mesas y cuentas
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Activo
          </label>
          {role !== "tv" ? (
            <>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pos}
                  onChange={(e) => setPos(e.target.checked)}
                />
                Acceso POS
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={inv}
                  onChange={(e) => setInv(e.target.checked)}
                />
                Acceso inventario
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cop}
                  onChange={(e) => setCop(e.target.checked)}
                />
                Acceso COP
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={purchase}
                  onChange={(e) => setPurchase(e.target.checked)}
                />
                Acceso compras
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={closures}
                  onChange={(e) => setClosures(e.target.checked)}
                />
                Acceso cierres
              </label>
            </>
          ) : (
            <p className="text-sm text-[var(--ad-muted)] sm:col-span-2">
              Usuario TV: sin POS, inventario, COP, compras ni cierres.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ad-btn ad-btn--gold" onClick={() => void save()}>
            {opId ? "Guardar cambios" : "Crear usuario"}
          </button>
          {opId ? (
            <button type="button" className="ad-btn" onClick={resetForm}>
              Nuevo usuario
            </button>
          ) : null}
        </div>
        {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
      </section>
    </div>
  );
}
