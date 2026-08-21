import { Link } from "react-router";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { polisurCopy } from "@/content/polisur";
import { homePolisurUnits } from "@/content/polisur-site";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

function unitLink(id: string): string {
  if (id === "unidad-canina") return POLISUR_ROUTES.unidadCanina;
  if (id === "institucion") return POLISUR_ROUTES.institucion;
  return POLISUR_ROUTES.divisiones;
}

function PolisurDivisions() {
  const { site } = usePolisurSite();
  const items = homePolisurUnits(site);

  return (
    <section
      className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-800)]"
      aria-labelledby="polisur-divisions-title"
    >
      <div className="ps-container py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="ps-eyebrow">{polisurCopy.divisions.eyebrow}</p>
          <h2
            id="polisur-divisions-title"
            className="mt-3 text-3xl text-[var(--ps-white)] sm:text-4xl"
          >
            {polisurCopy.divisions.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-400)] sm:text-base">
            {polisurCopy.divisions.body}
          </p>
        </div>
      </div>

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
              <h3 className="mt-2 text-2xl text-[var(--ps-white)] sm:text-3xl">
                {item.label}
              </h3>
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
    </section>
  );
}

export { PolisurDivisions };
