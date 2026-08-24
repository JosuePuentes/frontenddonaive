import { Link, useParams } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import {
  filterModulesForUser,
  getModuleById,
} from "@/lib/donaive-software/modules";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsPermission } from "@/types/donaive-software";

/** Interior de un módulo: lista solo funciones permitidas. */
export default function DsModuleHome() {
  const { moduleId = "" } = useParams();
  const { can, canAny } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  const canAccess = (permission: DsPermission | DsPermission[]) => {
    const list = Array.isArray(permission) ? permission : [permission];
    return list.length === 1 ? can(list[0]) : canAny(list);
  };

  const modRaw = getModuleById(moduleId);
  const mod = modRaw
    ? filterModulesForUser([modRaw], canAccess)[0]
    : undefined;

  if (!mod) {
    return (
      <div className="ds-panel">
        <p className="ds-muted">
          Módulo no encontrado o sin permiso de acceso.
        </p>
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
