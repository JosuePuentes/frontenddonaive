import { Link } from "react-router";
import { getDonaiveSoftwareRoutes } from "@/constants/donaive-software-routes";
import { isDonaiveDesktopRuntime } from "@/lib/donaive-software-host";

const RELEASES_URL =
  "https://github.com/JosuePuentes/frontenddonaive/releases/tag/v1.1.0-desktop";
const RELEASE_BASE =
  "https://github.com/JosuePuentes/frontenddonaive/releases/download/v1.1.0-desktop";

const INSTALLERS = [
  {
    id: "win-portable",
    title: "Windows · Programa portable",
    file: "Donaive-Software-1.1.0-portable.exe",
    href: `${RELEASE_BASE}/Donaive-Software-1.1.0-portable.exe`,
    note: "Descarga el .exe y ábrelo en tu PC. Es el sistema completo: no usa el navegador ni internet para operar.",
  },
  {
    id: "linux",
    title: "Linux · AppImage",
    file: "Donaive-Software-1.1.0-linux.AppImage",
    href: `${RELEASE_BASE}/Donaive-Software-1.1.0-linux.AppImage`,
    note: "Marca como ejecutable (chmod +x) y abre. Ventas, inventario y bancos quedan en el disco del usuario.",
  },
] as const;

function DsDescargarInner() {
  const routes = getDonaiveSoftwareRoutes();
  const onDesktop = isDonaiveDesktopRuntime();

  if (onDesktop) {
    return (
      <div>
        <nav className="ds-crumb">
          <Link to={routes.home}>Módulos</Link>
          <span>/</span>
          <span>Sistema local</span>
        </nav>
        <section className="ds-panel">
          <h1 className="ds-title">Ya estás en el sistema local</h1>
          <p className="ds-lead">
            Esta ventana es Donaive Software instalado en tu PC. Los datos se
            guardan en archivos de este equipo (no en la web).
          </p>
          <p className="ds-muted" style={{ marginTop: "1rem" }}>
            Menú Archivo → Abrir carpeta de datos… para ver la base local.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div>
      <nav className="ds-crumb">
        <Link to={routes.home}>Módulos</Link>
        <span>/</span>
        <span>Descargar sistema</span>
      </nav>

      <section className="ds-panel">
        <h1 className="ds-title">Descargar el sistema (PC local)</h1>
        <p className="ds-lead">
          No es “guardar la página web”. Es un programa de escritorio que se
          instala/ejecuta en tu computador: POS, inventario, bancos y reportes
          con datos en el disco de este equipo.
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
                <p
                  className="ds-muted"
                  style={{ marginTop: "0.35rem", fontSize: "0.8rem" }}
                >
                  {item.file}
                </p>
              </div>
              <a
                className="ds-btn ds-btn--primary"
                href={item.href}
                download={item.file}
              >
                Descargar programa
              </a>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <a
            className="ds-btn"
            href={RELEASES_URL}
            target="_blank"
            rel="noreferrer"
          >
            Otras versiones en GitHub
          </a>
        </div>
      </section>

      <section className="ds-panel" style={{ marginTop: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Qué obtienes</h2>
        <ol className="ds-muted" style={{ lineHeight: 1.6 }}>
          <li>Un ejecutable propio (Windows o Linux), no un acceso web.</li>
          <li>Ventana del sistema: menú Archivo / Ver / Ayuda.</li>
          <li>Base de datos local en la carpeta de datos del PC.</li>
          <li>Funciona sin depender del navegador para el día a día.</li>
        </ol>
      </section>
    </div>
  );
}

/** Página pública de descarga del sistema de escritorio. */
export default function DsDescargar() {
  return <DsDescargarInner />;
}
