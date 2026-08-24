import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

export default function DsPlaceholder({
  title,
  modulePath,
  moduleLabel,
  blurb,
}: {
  title: string;
  modulePath: string;
  moduleLabel: string;
  blurb: string;
}) {
  const routes = getDonaiveSoftwareRoutes();
  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={modulePath}>{moduleLabel}</Link>
        <span>/</span>
        <span>{title}</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">{title}</h1>
        <p className="ds-lead">{blurb}</p>
        <p className="ds-muted" style={{ marginTop: "1rem" }}>
          Función lista para conectar con datos reales / offline sync. La
          estructura del módulo ya está separada del resto del sistema.
        </p>
      </section>
    </div>
  );
}
