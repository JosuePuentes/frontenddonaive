import { useState } from "react";
import {
  adBootstrapRequest,
  adLoginRequest,
  adLogoutRequest,
  loadAdSession,
} from "@/services/ad-licoreria/session";
import { getAdDataSourceMode } from "@/services/ad-licoreria/repository-adapter";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

/**
 * Login A&D para modo API. En mock no se muestra.
 */
export function AdApiLoginPanel() {
  const mode = getAdDataSourceMode();
  const { hydrateApi, apiSessionReady } = useAdLicoreria();
  const session = loadAdSession();
  const [tenantSlug, setTenantSlug] = useState("ad-licoreria");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (mode !== "api") return null;

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await adLoginRequest({ tenantSlug, username, password });
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error);
      return;
    }
    setMsg(`Sesión: ${r.session.name} · ${r.session.role}`);
    await hydrateApi();
  }

  async function onBootstrap() {
    if (!password || password.length < 6) {
      setMsg("Password admin ≥ 6 para bootstrap");
      return;
    }
    setBusy(true);
    const r = await adBootstrapRequest({
      slug: tenantSlug,
      adminUsername: username,
      adminPassword: password,
    });
    setBusy(false);
    setMsg(
      r.ok
        ? `Bootstrap OK: ${JSON.stringify(r.data)}`
        : r.error,
    );
  }

  if (session && apiSessionReady) {
    return (
      <div className="ad-api-session-bar" style={{ padding: "0.5rem 1rem", fontSize: 13 }}>
        API · {session.tenantName} · {session.username} ({session.role})
        <button
          type="button"
          style={{ marginLeft: 12 }}
          onClick={() => {
            void adLogoutRequest().then(() => setMsg("Sesión cerrada"));
          }}
        >
          Cerrar sesión API
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onLogin}
      style={{
        padding: "1rem",
        borderBottom: "1px solid #ccc",
        display: "grid",
        gap: 8,
        maxWidth: 420,
      }}
    >
      <strong>A&D · Login API</strong>
      <input
        placeholder="Tenant slug"
        value={tenantSlug}
        onChange={(e) => setTenantSlug(e.target.value)}
      />
      <input
        placeholder="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={busy}>
          Entrar
        </button>
        <button type="button" disabled={busy} onClick={() => void onBootstrap()}>
          Bootstrap tenant
        </button>
      </div>
      {msg ? <p style={{ margin: 0 }}>{msg}</p> : null}
    </form>
  );
}
