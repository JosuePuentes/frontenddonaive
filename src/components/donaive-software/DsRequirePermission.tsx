import { Link, Navigate } from "react-router";
import type { ReactNode } from "react";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import type { DsPermission } from "@/types/donaive-software";

type Props = {
  permission: DsPermission | DsPermission[];
  children: ReactNode;
};

/** Bloquea pantallas sin permiso suficiente. */
export default function DsRequirePermission({ permission, children }: Props) {
  const { can, canAny, currentUser } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();
  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = perms.length === 1 ? can(perms[0]) : canAny(perms);

  if (!currentUser) {
    return <Navigate to={routes.login} replace />;
  }

  if (!allowed) {
    return (
      <div className="ds-panel">
        <h1 className="ds-title" style={{ fontSize: "1.4rem" }}>
          Sin acceso
        </h1>
        <p className="ds-lead">
          Tu rol ({currentUser.role}) no tiene permiso para esta función.
        </p>
        <Link className="ds-btn" to={routes.home} style={{ marginTop: "1rem" }}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  return children;
}
