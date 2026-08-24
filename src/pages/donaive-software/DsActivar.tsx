import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import type { DsActivationRequest } from "@/lib/donaive-software/license-api";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

export default function DsActivar() {
  const { requestActivation, activateWithCode } = useDonaiveSoftware();
  const navigate = useNavigate();
  const routes = getDonaiveSoftwareRoutes();
  const [request, setRequest] = useState<DsActivationRequest | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onRequest() {
    setBusy(true);
    setError("");
    try {
      const next = await requestActivation();
      setRequest(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar la solicitud.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Ingresa el código de activación que te entregó Donaive.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await activateWithCode(code.trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(routes.login, { replace: true });
  }

  return (
    <div className="ds-panel" style={{ maxWidth: 520, margin: "2rem auto" }}>
      <h1 className="ds-title">Activar Donaive Software</h1>
      <p className="ds-lead">
        Cada equipo necesita un código de activación de un solo uso autorizado
        por Donaive. Sin código válido no se puede operar el sistema.
      </p>

      <section
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          borderRadius: "var(--ds-radius-md)",
          border: "1px solid var(--ds-border)",
          background: "var(--ds-surface-muted)",
        }}
      >
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
          Paso 1 · Solicitar activación en este equipo
        </h2>
        <p className="ds-muted" style={{ margin: "0 0 1rem", fontSize: "0.9rem" }}>
          Genera un código de solicitud y comunícaselo a Donaive para que
          vincule este equipo a tu licencia.
        </p>
        {request ? (
          <div>
            <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
              Código de solicitud
            </div>
            <div
              className="ds-stat"
              style={{ letterSpacing: "0.08em", fontFamily: "monospace" }}
            >
              {request.requestCode}
            </div>
            <p className="ds-muted" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
              Estado:{" "}
              {request.status === "pending"
                ? "Pendiente de aprobación"
                : request.status === "approved"
                  ? "Aprobada — ingresa el código de activación abajo"
                  : "Rechazada"}
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="ds-btn"
            disabled={busy}
            onClick={() => void onRequest()}
          >
            {busy ? "Registrando…" : "Generar solicitud en este equipo"}
          </button>
        )}
      </section>

      <form
        onSubmit={(e) => void onSubmit(e)}
        style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}
      >
        <h2 style={{ margin: 0, fontSize: "1rem" }}>
          Paso 2 · Código de activación (un solo uso)
        </h2>
        <label className="ds-label">
          Código entregado por Donaive
          <input
            className="ds-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej. ABCD-EFGH"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        {error ? (
          <p style={{ color: "var(--ds-danger)", margin: 0, fontSize: "0.9rem" }}>
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="ds-btn ds-btn--primary"
          disabled={busy}
        >
          {busy ? "Activando…" : "Activar sistema en este equipo"}
        </button>
      </form>
    </div>
  );
}
