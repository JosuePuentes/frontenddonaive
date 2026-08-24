import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import {
  filterModulesForUser,
  getDonaiveSoftwareModules,
} from "@/lib/donaive-software/modules";
import { DS_ROLE_LABELS } from "@/lib/donaive-software/access";
import { isDonaiveDesktopRuntime } from "@/lib/donaive-software-host";
import {
  getDesktopDataPath,
  openDesktopDataFolder,
} from "@/lib/donaive-software/persist";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsPermission } from "@/types/donaive-software";

/** Hub: solo módulos permitidos para el usuario. */
export default function DsHub() {
  const { license, currentUser, can, canAny } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const onDesktop = isDonaiveDesktopRuntime();
  const dataPath = getDesktopDataPath();

  const canAccess = (permission: DsPermission | DsPermission[]) => {
    const list = Array.isArray(permission) ? permission : [permission];
    return list.length === 1 ? can(list[0]) : canAny(list);
  };

  const modules = filterModulesForUser(getDonaiveSoftwareModules(), canAccess);

  return (
    <div>
      <section className="ds-panel">
        <p className="ds-muted" style={{ margin: 0, fontSize: "0.8rem" }}>
          {onDesktop ? "Sistema local en este PC" : "Demo en navegador"}
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
        <div style={{ marginTop: "0.85rem", display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
          {onDesktop ? (
            <button
              type="button"
              className="ds-btn"
              onClick={() => void openDesktopDataFolder()}
            >
              Abrir carpeta de datos
            </button>
          ) : (
            <Link className="ds-btn ds-btn--primary" to={routes.descargar}>
              Descargar sistema para PC
            </Link>
          )}
        </div>
        {onDesktop && dataPath ? (
          <p className="ds-muted" style={{ marginTop: "0.75rem", fontSize: "0.78rem" }}>
            Base local: {dataPath}
          </p>
        ) : null}
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
