import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { DS_DEFAULT_ADMIN_PASSWORD } from "@/lib/donaive-software/auth";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

export default function DsLogin() {
  const { login, currentUser, license } = useDonaiveSoftware();
  const navigate = useNavigate();
  const routes = getDonaiveSoftwareRoutes();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (currentUser) {
    return <Navigate to={routes.home} replace />;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    void login(username, password).then((r) => {
      setBusy(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      navigate(routes.home, { replace: true });
    });
  }

  return (
    <div className="ds-panel" style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h1 className="ds-title">Entrar</h1>
      <p className="ds-lead">
        {license?.businessName
          ? `Operadores de ${license.businessName}.`
          : "Inicia sesión para continuar."}
      </p>
      <form
        onSubmit={onSubmit}
        style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}
      >
        <label className="ds-label">
          Usuario
          <input
            className="ds-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </label>
        <label className="ds-label">
          Contraseña
          <input
            className="ds-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p style={{ color: "var(--ds-danger)", margin: 0, fontSize: "0.9rem" }}>
            {error}
          </p>
        ) : null}
        <button type="submit" className="ds-btn ds-btn--primary" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="ds-muted" style={{ marginTop: "1.25rem", fontSize: "0.8rem" }}>
        Primera activación: usuario <strong>admin</strong> · contraseña{" "}
        <strong>{DS_DEFAULT_ADMIN_PASSWORD}</strong>
        . El presidente entra con el usuario creado en el panel Donaive.
      </p>
    </div>
  );
}
