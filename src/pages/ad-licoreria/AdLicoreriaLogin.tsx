import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { roleHomePath } from "@/lib/ad-licoreria/nav-by-role";
import type { AdRole } from "@/types/ad-licoreria";
import {
  adLoginRequest,
  isAdSessionValid,
  loadAdSession,
} from "@/services/ad-licoreria/session";
import { adMockLogin } from "@/services/ad-licoreria/mock-login";
import { getAdDataSourceMode } from "@/services/ad-licoreria/repository-adapter";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

/**
 * Login A&D — siempre pide usuario y contraseña.
 * API: JWT. Sin API: valida operadores demo (admin / AdDemo#2026).
 * No muestra credenciales en la UI pública.
 */
export default function AdLicoreriaLogin() {
  const navigate = useNavigate();
  const mode = getAdDataSourceMode();
  const { hydrateApi, getCurrentOperator } = useAdLicoreria();
  const existing = loadAdSession();
  const mockSession = getCurrentOperator();
  const [tenantSlug, setTenantSlug] = useState("ad-licoreria");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === "api" && isAdSessionValid(existing)) {
      navigate(roleHomePath(existing!.role as AdRole), { replace: true });
      return;
    }
    if (mode !== "api" && mockSession) {
      navigate(roleHomePath(mockSession.role), { replace: true });
    }
  }, [mode, existing, mockSession, navigate]);

  if (mode === "api" && isAdSessionValid(existing)) {
    return (
      <Navigate to={roleHomePath(existing!.role as AdRole)} replace />
    );
  }
  if (mode !== "api" && mockSession) {
    return <Navigate to={roleHomePath(mockSession.role)} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "api") {
        const r = await adLoginRequest({ tenantSlug, username, password });
        if (!r.ok) {
          setMsg(r.error);
          return;
        }
        await hydrateApi();
        navigate(roleHomePath(r.session.role as AdRole), { replace: true });
        return;
      }
      const r = adMockLogin({ username, password });
      if (!r.ok) {
        setMsg(r.error);
        return;
      }
      navigate(roleHomePath(r.operator.role), { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ad-login-page">
      <div className="ad-login-card">
        <AdLicoreriaBrandMark size="lg" showText />
        <h1 className="ad-display mt-4 text-3xl text-[var(--ad-gold-soft)]">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-sm text-[var(--ad-muted)]">
          Acceso operativo A&amp;D Licorería &amp; Bodegón
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          {mode === "api" ? (
            <label className="text-sm text-[var(--ad-muted)]">
              Tenant
              <input
                className="ad-input mt-1"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
                autoComplete="organization"
                required
              />
            </label>
          ) : null}
          <label className="text-sm text-[var(--ad-muted)]">
            Usuario
            <input
              className="ad-input mt-1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="text-sm text-[var(--ad-muted)]">
            Contraseña
            <input
              className="ad-input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button
            type="submit"
            className="ad-btn ad-btn--gold"
            disabled={busy}
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
          {msg ? (
            <p className="text-sm text-red-400" role="alert">
              {msg}
            </p>
          ) : null}
        </form>
        <Link
          className="ad-btn mt-4 inline-flex"
          to={AD_LICORERIA_ROUTES.home}
        >
          Volver al Home
        </Link>
      </div>
    </div>
  );
}
