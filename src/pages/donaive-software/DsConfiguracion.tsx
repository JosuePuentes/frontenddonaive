import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import DsRequirePermission from "@/components/donaive-software/DsRequirePermission";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";

function DsConfigLicenciaInner() {
  const { license, deactivate } = useDonaiveSoftware();
  const routes = getDonaiveSoftwareRoutes();

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <Link to={routes.configuracion}>Configuración</Link>
        <span>/</span>
        <span>Licencia</span>
      </nav>
      <section className="ds-panel">
        <h1 className="ds-title">Licencia / negocio</h1>
        <p className="ds-lead">
          El sistema se presenta como <strong>Donaive</strong> operando para el
          negocio activado.
        </p>
        <div style={{ marginTop: "1.25rem" }}>
          <div className="ds-muted" style={{ fontSize: "0.8rem" }}>
            Negocio
          </div>
          <div className="ds-stat">{license?.businessName ?? "—"}</div>
          {license?.activatedAt ? (
            <p className="ds-muted" style={{ marginTop: "0.5rem" }}>
              Activado:{" "}
              {new Date(license.activatedAt).toLocaleString("es-VE")}
              {license.licenseId ? ` · licencia ${license.licenseId}` : ""}
            </p>
          ) : null}
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            className="ds-btn"
            onClick={() => {
              if (confirm("¿Desactivar licencia en este equipo?")) deactivate();
            }}
          >
            Desactivar en este equipo
          </button>
        </div>
      </section>
    </div>
  );
}

export default function DsConfiguracion() {
  return (
    <DsRequirePermission permission="license.manage">
      <DsConfigLicenciaInner />
    </DsRequirePermission>
  );
}
