import { Link } from "react-router";
import { getDonaiveSoftwareModules } from "@/lib/donaive-software/modules";
import { useDonaiveSoftware } from "@/providers/donaive-software/DonaiveSoftwareProvider";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

/** Hub: solo módulos. Al entrar a uno se ven sus funciones. */
export default function DsHub() {
  const { license } = useDonaiveSoftware();
  const modules = getDonaiveSoftwareModules();
  const routes = getDonaiveSoftwareRoutes();

  return (
    <div>
      <section className="ds-panel">
        <p className="ds-muted" style={{ margin: 0, fontSize: "0.8rem" }}>
          Sistema activo
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

      <div className="ds-grid-modules">
        {modules.map((m) => (
          <Link key={m.id} className="ds-module-card" to={routes.modulo(m.id)}>
            <h2>{m.title}</h2>
            <p>{m.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
