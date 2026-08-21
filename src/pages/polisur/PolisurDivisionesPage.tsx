import { Link } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { polisurCopy } from "@/content/polisur";
import { homePolisurUnits } from "@/content/polisur-site";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

function unitLink(id: string): string {
  if (id === "unidad-canina") return POLISUR_ROUTES.unidadCanina;
  if (id === "institucion") return POLISUR_ROUTES.institucion;
  return POLISUR_ROUTES.preinscripcion;
}

export default function PolisurDivisionesPage() {
  const { site } = usePolisurSite();
  const items = homePolisurUnits(site);

  return (
    <>
      <PageMeta
        title="Divisiones — POLISUR"
        description="Divisiones y unidades del Instituto Autónomo Policía Municipal de San Francisco."
      />
      <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]">
        <div className="ps-container py-14 sm:py-20">
          <p className="ps-eyebrow">{polisurCopy.divisions.eyebrow}</p>
          <h1 className="mt-3 text-4xl text-[var(--ps-white)] sm:text-5xl">
            {polisurCopy.divisions.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
            Elija la división a la que desea acceder. Unidad Canina y demás
            unidades se consultan desde aquí.
          </p>
        </div>
      </section>

      <section className="bg-[var(--ps-navy-900)]">
        {items.length === 0 ? (
          <div className="ps-container py-16 text-sm text-[var(--ps-steel-400)]">
            Aún no hay divisiones publicadas. Se configuran en Acceso
            institucional → Sitio web → Divisiones.
          </div>
        ) : (
          <div className="ps-division-mosaic">
            {items.map((item) => (
              <article key={item.id} className="ps-division-block">
                <PolisurMedia
                  src={item.imageUrl || "/polisur/home/about.jpg"}
                  alt={item.label}
                  className="ps-division-block__media"
                  objectPosition={item.featured ? "center 40%" : "center"}
                  overlay="strong"
                />
                <div className="ps-division-block__body">
                  {item.featured ? (
                    <p className="ps-eyebrow text-[var(--ps-mint)]">Destacada</p>
                  ) : null}
                  <h2 className="mt-2 text-2xl text-[var(--ps-white)] sm:text-3xl">
                    {item.label}
                  </h2>
                  {item.summary ? (
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--ps-paper)]/88">
                      {item.summary}
                    </p>
                  ) : null}
                  <Link
                    to={unitLink(item.id)}
                    className="mt-5 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ps-white)] underline-offset-4 hover:underline"
                  >
                    Acceder
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
