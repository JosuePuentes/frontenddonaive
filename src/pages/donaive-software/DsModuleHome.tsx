import { Link, useParams } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { getModuleById } from "@/lib/donaive-software/modules";

/** Interior de un módulo: lista solo sus funciones. */
export default function DsModuleHome() {
  const { moduleId = "" } = useParams();
  const mod = getModuleById(moduleId);
  const routes = getDonaiveSoftwareRoutes();

  if (!mod) {
    return (
      <div className="ds-panel">
        <p className="ds-muted">Módulo no encontrado.</p>
        <Link className="ds-btn" to={routes.home}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <span>{mod.title}</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">{mod.title}</h1>
        <p className="ds-lead">{mod.description}</p>
      </section>
      <div className="ds-feature-list">
        {mod.features.map((f) => (
          <Link key={f.id} className="ds-feature" to={f.path}>
            <div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
            <span className="ds-btn ds-btn--primary">Abrir</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
