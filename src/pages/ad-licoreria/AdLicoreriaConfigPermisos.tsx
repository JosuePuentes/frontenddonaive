import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import {
  AD_ALL_PERMISSIONS,
  AD_DEFAULT_ROLE_PERMISSIONS,
  AD_PERMISSION_LABELS,
  AD_ROLE_LABELS,
} from "@/lib/ad-licoreria/access";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import type { AdPermission, AdRole } from "@/types/ad-licoreria";

const ROLES: AdRole[] = [
  "admin",
  "supervisor",
  "cajero",
  "mesonera",
  "inventario",
];

/** Filas resumidas de la matriz pedida en Fase 8. */
const MATRIX_ROWS: { label: string; permissions: AdPermission[] }[] = [
  { label: "POS", permissions: ["pos.sell", "pos.close_account"] },
  { label: "Override faltante", permissions: ["pos.shortage_override"] },
  {
    label: "Inventario",
    permissions: ["inventory.read", "inventory.adjust"],
  },
  {
    label: "Transferencias",
    permissions: ["inventory.transfer", "cop.transfer"],
  },
  {
    label: "Compras",
    permissions: ["purchase.create", "purchase.approve"],
  },
  { label: "COP", permissions: ["cop.read"] },
  { label: "Usuarios", permissions: ["users.manage"] },
];

export default function AdLicoreriaConfigPermisos() {
  const {
    getRolePermissionMatrix,
    setRolePermissions,
    operators,
    hasPermission,
    setCurrentOperator,
  } = useAdLicoreria();
  const matrix = getRolePermissionMatrix();
  const [editRole, setEditRole] = useState<AdRole>("cajero");
  const [selected, setSelected] = useState<AdPermission[]>(
    matrix.cajero ?? AD_DEFAULT_ROLE_PERMISSIONS.cajero,
  );
  const [msg, setMsg] = useState("");

  const current = useMemo(
    () => operators.find((o) => o.role === "admin"),
    [operators],
  );
  const canEdit = hasPermission("users.manage") || hasPermission("settings.manage");

  function loadRole(role: AdRole) {
    setEditRole(role);
    setSelected([...(matrix[role] ?? AD_DEFAULT_ROLE_PERMISSIONS[role])]);
  }

  function toggle(p: AdPermission) {
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function save() {
    if (!canEdit) {
      setMsg("Solo ADMIN puede ajustar la matriz");
      return;
    }
    if (current) setCurrentOperator(current.id);
    const r = setRolePermissions({
      role: editRole,
      permissions: selected,
      userName: current?.name ?? "Admin",
    });
    setMsg(r.ok ? `Permisos de ${AD_ROLE_LABELS[editRole]} actualizados` : r.error);
  }

  function roleHas(role: AdRole, perms: AdPermission[]) {
    const list = matrix[role] ?? [];
    return perms.some((p) => list.includes(p));
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ad-eyebrow">Configuración · solo ADMIN</p>
          <h1 className="ad-display text-4xl text-[var(--ad-gold-soft)]">
            Matriz de permisos
          </h1>
        </div>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configUsuarios}>
          ← Usuarios
        </Link>
      </header>

      <section className="ad-panel">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>Permiso</th>
                {ROLES.map((r) => (
                  <th key={r}>{AD_ROLE_LABELS[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_ROWS.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  {ROLES.map((role) => (
                    <td key={role}>
                      {roleHas(role, row.permissions) ? "✓" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ad-panel space-y-3">
        <h2 className="ad-panel-title">Ajustar rol (ADMIN)</h2>
        <select
          className="ad-select max-w-xs"
          value={editRole}
          onChange={(e) => loadRole(e.target.value as AdRole)}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {AD_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AD_ALL_PERMISSIONS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(p)}
                onChange={() => toggle(p)}
              />
              {AD_PERMISSION_LABELS[p]}
            </label>
          ))}
        </div>
        <button
          type="button"
          className="ad-btn ad-btn--gold"
          onClick={save}
          disabled={!canEdit}
        >
          Guardar permisos del rol
        </button>
        {!canEdit ? (
          <p className="text-sm text-[var(--ad-muted)]">
            Cambie la sesión a ADMIN para editar la matriz.
          </p>
        ) : null}
        {msg ? <p className="text-sm text-[var(--ad-gold-soft)]">{msg}</p> : null}
      </section>
    </div>
  );
}
