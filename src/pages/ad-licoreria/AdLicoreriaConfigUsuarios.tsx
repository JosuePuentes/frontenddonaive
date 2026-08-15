import { useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  AD_DEFAULT_ROLE_PERMISSIONS,
  AD_ROLE_LABELS,
} from "@/lib/ad-licoreria/access";
import { uid } from "@/lib/ad-licoreria/conversions";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
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
  const [mockCredential, setMockCredential] = useState("");
  const [tvScreenId, setTvScreenId] = useState("");
  const [tvGroupId, setTvGroupId] = useState("");
  const [msg, setMsg] = useState("");

  function load(o: AdOperator) {
    setOpId(o.id);
    setUsername(o.username);
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
    setMockCredential(o.mockCredential ?? "");
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

  function save() {
    const isTv = role === "tv";
    const existing = opId
      ? operators.find((o) => o.id === opId)
      : undefined;
    const operator: AdOperator = {
      id: opId ?? uid("op"),
      username,
      name,
      phone: phone.trim() || undefined,
      role,
      active,
      warehouseId: isTv ? null : warehouseId || null,
      posEnabled: isTv ? false : pos,
      inventoryAccess: isTv ? false : inv,
      copAccess: isTv ? false : cop,
      purchaseAccess: isTv ? false : purchase,
      closuresAccess: isTv ? false : closures,
      mockCredential: mockCredential.trim() || undefined,
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
    const r = upsertOperator(operator);
    setMsg(r.ok ? `Usuario ${r.data.username} guardado` : r.error);
    if (r.ok) {
      setOpId(null);
      setUsername("");
      setName("");
      setPhone("");
      setMockCredential("");
      setTvScreenId("");
      setTvGroupId("");
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
            Incluye tipo TV (solo Digital Signage). Credencial mock opcional.
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
                      onClick={() => {
                        const r = setCurrentOperator(o.id);
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
          <input
            className="ad-input"
            placeholder="Usuario (login)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="ad-input"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
              <input
                className="ad-input"
                placeholder="Credencial mock"
                value={mockCredential}
                onChange={(e) => setMockCredential(e.target.value)}
              />
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
        <button type="button" className="ad-btn ad-btn--gold" onClick={save}>
          Guardar
        </button>
        {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
      </section>
    </div>
  );
}
