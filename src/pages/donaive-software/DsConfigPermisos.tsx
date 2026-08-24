import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import {
  DS_ALL_PERMISSIONS,
  DS_DEFAULT_ROLE_PERMISSIONS,
  DS_PERMISSION_LABELS,
  DS_ROLE_LABELS,
} from "@/lib/donaive-software/access";
import { getEffectiveRolePermissions } from "@/lib/donaive-software/auth";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsPermission, DsRole } from "@/types/donaive-software";

const EDITABLE_ROLES: DsRole[] = [
  "supervisor",
  "cajero",
  "inventario",
  "finanzas",
];

const MATRIX_GROUPS: { label: string; permissions: DsPermission[] }[] = [
  {
    label: "POS",
    permissions: ["pos.sell", "pos.refund", "pos.discount", "pos.closures"],
  },
  {
    label: "Inventario",
    permissions: [
      "inventory.read",
      "inventory.adjust",
      "inventory.products",
      "inventory.movements",
    ],
  },
  {
    label: "Compras",
    permissions: [
      "purchases.create",
      "purchases.manage",
      "purchases.approve",
    ],
  },
  {
    label: "Finanzas",
    permissions: [
      "finance.rates",
      "finance.cpp",
      "finance.accounts",
      "finance.manage",
    ],
  },
  {
    label: "Clientes / proveedores",
    permissions: ["clients.read", "clients.manage", "suppliers.manage"],
  },
  {
    label: "Informes / análisis",
    permissions: [
      "reports.read",
      "reports.daily",
      "analysis.view",
      "planning.view",
      "president.view",
    ],
  },
  {
    label: "Administración",
    permissions: ["users.manage", "settings.manage", "license.manage"],
  },
];

function DsConfigPermisosInner() {
  const { roleMatrix, setRolePermissions } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const [editRole, setEditRole] = useState<DsRole>("cajero");
  const [selected, setSelected] = useState<DsPermission[]>(() =>
    getEffectiveRolePermissions("cajero"),
  );
  const [msg, setMsg] = useState("");

  const effectiveMatrix = useMemo(() => {
    const m: Partial<Record<DsRole, DsPermission[]>> = {};
    for (const role of EDITABLE_ROLES) {
      m[role] = getEffectiveRolePermissions(role);
    }
    return { ...m, ...roleMatrix };
  }, [roleMatrix]);

  useEffect(() => {
    setSelected([...(effectiveMatrix[editRole] ?? DS_DEFAULT_ROLE_PERMISSIONS[editRole])]);
  }, [editRole, effectiveMatrix]);

  function loadRole(role: DsRole) {
    setEditRole(role);
    setSelected([...(effectiveMatrix[role] ?? DS_DEFAULT_ROLE_PERMISSIONS[role])]);
    setMsg("");
  }

  function toggle(p: DsPermission) {
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function save() {
    const r = setRolePermissions({ role: editRole, permissions: selected });
    setMsg(r.ok ? `Permisos de ${DS_ROLE_LABELS[editRole]} actualizados` : r.error);
  }

  function roleHas(role: DsRole, perms: DsPermission[]) {
    const list = effectiveMatrix[role] ?? [];
    return perms.some((p) => list.includes(p));
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.configuracion}>Configuración</Link>
        <span>/</span>
        <span>Permisos</span>
      </nav>

      <section className="ds-panel">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "flex-end",
          }}
        >
          <div>
            <h1 className="ds-title">Permisos por rol</h1>
            <p className="ds-lead">
              ADMIN siempre tiene acceso total. Ajusta qué puede hacer cada rol
              operativo.
            </p>
          </div>
          <Link className="ds-btn" to={routes.configUsuarios}>
            ← Usuarios
          </Link>
        </div>

        <div style={{ marginTop: "1.25rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Área</th>
                {(["supervisor", "cajero", "inventario", "finanzas"] as DsRole[]).map(
                  (role) => (
                    <th key={role}>{DS_ROLE_LABELS[role]}</th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {MATRIX_GROUPS.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  {(["supervisor", "cajero", "inventario", "finanzas"] as DsRole[]).map(
                    (role) => (
                      <td key={role}>
                        {roleHas(role, row.permissions) ? "✓" : "—"}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Editar rol</h2>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {EDITABLE_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className={`ds-btn${editRole === role ? " ds-btn--primary" : ""}`}
              onClick={() => loadRole(role)}
            >
              {DS_ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gap: "0.45rem",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {DS_ALL_PERMISSIONS.map((p) => (
            <label
              key={p}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.45rem",
                fontSize: "0.85rem",
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(p)}
                onChange={() => toggle(p)}
              />
              {DS_PERMISSION_LABELS[p]}
            </label>
          ))}
        </div>

        {msg ? (
          <p
            style={{
              marginTop: "1rem",
              color: msg.includes("actualizados") ? "var(--ds-ok)" : "var(--ds-danger)",
            }}
          >
            {msg}
          </p>
        ) : null}

        <button
          type="button"
          className="ds-btn ds-btn--primary"
          style={{ marginTop: "1rem" }}
          onClick={save}
        >
          Guardar {DS_ROLE_LABELS[editRole]}
        </button>
      </section>
    </div>
  );
}

export default function DsConfigPermisos() {
  return (
    <DsRequirePermission permission="users.manage">
      <DsConfigPermisosInner />
    </DsRequirePermission>
  );
}
