import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  AD_DEFAULT_ROLE_PERMISSIONS,
  AD_ROLE_LABELS,
} from "@/lib/ad-licoreria/access";
import { uid } from "@/lib/ad-licoreria/conversions";
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
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
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
    setWarehouseId(o.warehouseId ?? "");
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
      setWarehouseId("");
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
      warehouseId: isTv ? null : warehouseId || null,
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
            Defina usuario y contraseña de acceso. Al editar, deje la clave
            vacía si no desea cambiarla.
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
                      : o.warehouseId
                        ? warehouses.find((w) => w.id === o.warehouseId)?.name
                        : "Transversal"}
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
          <input
            className="ad-input"
            placeholder="Teléfono (opcional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select
            className="ad-select"
            value={role}
            onChange={(e) => onRoleChange(e.target.value as AdRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {AD_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
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
            <select
              className="ad-select"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">Transversal</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
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
