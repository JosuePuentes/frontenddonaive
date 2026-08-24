import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";

const RELEASES_URL =
  "https://github.com/JosuePuentes/frontenddonaive/releases/tag/v1.0.0-desktop";
const RELEASE_BASE =
  "https://github.com/JosuePuentes/frontenddonaive/releases/download/v1.0.0-desktop";

const INSTALLERS = [
  {
    id: "win-portable",
    title: "Windows · Portable",
    file: "Donaive-Software-1.0.0-portable.exe",
    href: `${RELEASE_BASE}/Donaive-Software-1.0.0-portable.exe`,
    note: "Descarga y ejecuta. No requiere instalador. Ideal para PC de oficina o USB.",
  },
  {
    id: "linux",
    title: "Linux · AppImage",
    file: "Donaive-Software-1.0.0-linux.AppImage",
    href: `${RELEASE_BASE}/Donaive-Software-1.0.0-linux.AppImage`,
    note: "Marca como ejecutable (chmod +x) y abre. Datos en tu usuario local.",
  },
] as const;

function DsDescargarInner() {
  const routes = getDonaiveSoftwareRoutes();

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <span>Descargar</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Descargar Donaive Software</h1>
        <p className="ds-lead">
          Aplicación de escritorio para usar en tu PC, con datos locales. No es
          “instalar la web”: es el sistema completo para Windows o Linux.
        </p>

        <div
          style={{
            marginTop: "1.25rem",
            display: "grid",
            gap: "0.85rem",
          }}
        >
          {INSTALLERS.map((item) => (
            <div key={item.id} className="ds-feature">
              <div>
                <h3>{item.title}</h3>
                <p>{item.note}</p>
                <p className="ds-muted" style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}>
                  {item.file}
                </p>
              </div>
              <a
                className="ds-btn ds-btn--primary"
                href={item.href}
                download={item.file}
              >
                Descargar
              </a>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <a className="ds-btn" href={RELEASES_URL} target="_blank" rel="noreferrer">
            Ver todas las versiones en GitHub
          </a>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Cómo funciona</h2>
        <ol className="ds-muted" style={{ lineHeight: 1.6 }}>
          <li>Descarga el instalador de tu sistema operativo.</li>
          <li>Instala o ejecuta el portable.</li>
          <li>Abre Donaive Software en tu PC (ventana propia).</li>
          <li>Activa la licencia y entra con tu usuario local.</li>
          <li>Ventas, inventario y bancos se guardan en el equipo.</li>
        </ol>
        <p className="ds-muted" style={{ marginTop: "0.75rem" }}>
          Demo web (misma lógica, en el navegador):{" "}
          <Link to={routes.login} style={{ color: "var(--ds-accent)" }}>
            entrar como admin
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

/** Página pública de descarga del instalador de escritorio. */
export default function DsDescargar() {
  return <DsDescargarInner />;
}
