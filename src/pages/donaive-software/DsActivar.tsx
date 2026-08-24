import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

export default function DsActivar() {
  const { activate } = useDonaiveSoftware();
  const navigate = useNavigate();
  const routes = getDonaiveSoftwareRoutes();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Indica el nombre del negocio");
      return;
    }
    activate(name, key || undefined);
    navigate(routes.login, { replace: true });
  }

  return (
    <div className="ds-panel" style={{ maxWidth: 480, margin: "2rem auto" }}>
      <h1 className="ds-title">Activar Donaive</h1>
      <p className="ds-lead">
        Coloca el nombre del negocio. Queda como licencia activa en este equipo
        (modo offline-first).
      </p>
      <form onSubmit={onSubmit} style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
        <label className="ds-label">
          Nombre del negocio *
          <input
            className="ds-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Bodegón La Esquina"
            autoFocus
          />
        </label>
        <label className="ds-label">
          Código de licencia (opcional)
          <input
            className="ds-input"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Se validará cuando exista API"
          />
        </label>
        {error ? (
          <p style={{ color: "var(--ds-danger)", margin: 0, fontSize: "0.9rem" }}>
            {error}
          </p>
        ) : null}
        <button type="submit" className="ds-btn ds-btn--primary">
          Activar sistema
        </button>
      </form>
    </div>
  );
}
