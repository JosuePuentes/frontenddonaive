import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import {
  filterModulesForUser,
  getDonaiveSoftwareModules,
} from "@/lib/donaive-software/modules";
import { DS_ROLE_LABELS } from "@/lib/donaive-software/access";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsPermission } from "@/types/donaive-software";

/** Hub: solo módulos permitidos para el usuario. */
export default function DsHub() {
  const { license, currentUser, can, canAny } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  const canAccess = (permission: DsPermission | DsPermission[]) => {
    const list = Array.isArray(permission) ? permission : [permission];
    return list.length === 1 ? can(list[0]) : canAny(list);
  };

  const modules = filterModulesForUser(getDonaiveSoftwareModules(), canAccess);

  return (
    <div>
      <section className="ds-panel">
        <p className="ds-muted" style={{ margin: 0, fontSize: "0.8rem" }}>
          Sistema activo
          {currentUser
            ? ` · ${currentUser.name} (${DS_ROLE_LABELS[currentUser.role]})`
            : ""}
        </p>
        <h1 className="ds-title" style={{ marginTop: "0.35rem" }}>
          Donaive
        </h1>
        <p className="ds-lead">
          {license?.businessName
            ? `Operando como ${license.businessName}. Elige un módulo; adentro están solo las funciones de ese módulo.`
            : "Elige un módulo para trabajar."}
        </p>
      </section>

      {modules.length === 0 ? (
        <section className="ds-panel" style={{ marginTop: "1.25rem" }}>
          <p className="ds-muted" style={{ margin: 0 }}>
            Tu usuario no tiene módulos asignados. Pide a un administrador que
            revise tu rol o permisos.
          </p>
        </section>
      ) : (
        <div className="ds-grid-modules">
          {modules.map((m) => (
            <Link key={m.id} className="ds-module-card" to={routes.modulo(m.id)}>
              <h2>{m.title}</h2>
              <p>{m.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
