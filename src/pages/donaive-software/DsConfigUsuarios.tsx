import { useState } from "react";
import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { DS_ROLE_LABELS } from "@/lib/donaive-software/access";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsRole } from "@/types/donaive-software";

const ROLES: DsRole[] = [
  "admin",
  "supervisor",
  "cajero",
  "inventario",
  "finanzas",
];

function DsConfigUsuariosInner() {
  const { users, upsertUser } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  const [editId, setEditId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [role, setRole] = useState<DsRole>("cajero");
  const [active, setActive] = useState(true);
  const [msg, setMsg] = useState("");

  function reset() {
    setEditId(null);
    setUsername("");
    setName("");
    setPassword("");
    setPasswordConfirm("");
    setRole("cajero");
    setActive(true);
    setMsg("");
  }

  function loadUser(id: string) {
    const u = users.find((x) => x.id === id);
    if (!u) return;
    setEditId(u.id);
    setUsername(u.username);
    setName(u.name);
    setPassword("");
    setPasswordConfirm("");
    setRole(u.role);
    setActive(u.active);
    setMsg("");
  }

  function save() {
    const pwd = password.trim();
    if (!editId) {
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

    const r = upsertUser({
      id: editId ?? undefined,
      username,
      name,
      role,
      active,
      password: pwd || undefined,
    });
    setMsg(r.ok ? "Usuario guardado" : r.error);
    if (r.ok) reset();
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.configuracion}>Configuración</Link>
        <span>/</span>
        <span>Usuarios</span>
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
            <h1 className="ds-title">Usuarios</h1>
            <p className="ds-lead">
              Operadores locales del negocio. Cada uno entra con su usuario y
              ve solo los módulos permitidos.
            </p>
          </div>
          <Link className="ds-btn" to={routes.configPermisos}>
            Permisos por rol
          </Link>
        </div>

        <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.name}</td>
                  <td>{DS_ROLE_LABELS[u.role]}</td>
                  <td>{u.active ? "Activo" : "Inactivo"}</td>
                  <td>
                    <button
                      type="button"
                      className="ds-btn"
                      onClick={() => loadUser(u.id)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
          {editId ? "Editar usuario" : "Nuevo usuario"}
        </h2>
        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gap: "0.85rem",
            maxWidth: 420,
          }}
        >
          <label className="ds-label">
            Usuario (login)
            <input
              className="ds-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="ds-label">
            Nombre
            <input
              className="ds-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="ds-label">
            Rol
            <select
              className="ds-input"
              value={role}
              onChange={(e) => setRole(e.target.value as DsRole)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {DS_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="ds-label">
            Contraseña {editId ? "(dejar vacío para no cambiar)" : "*"}
            <input
              className="ds-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="ds-label">
            Confirmar contraseña
            <input
              className="ds-input"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.9rem",
            }}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Usuario activo
          </label>
          {msg ? (
            <p
              style={{
                margin: 0,
                color: msg.includes("guardado") ? "var(--ds-ok)" : "var(--ds-danger)",
                fontSize: "0.9rem",
              }}
            >
              {msg}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="ds-btn ds-btn--primary"
              onClick={save}
            >
              Guardar
            </button>
            {editId ? (
              <button type="button" className="ds-btn" onClick={reset}>
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DsConfigUsuarios() {
  return (
    <DsRequirePermission permission="users.manage">
      <DsConfigUsuariosInner />
    </DsRequirePermission>
  );
}
