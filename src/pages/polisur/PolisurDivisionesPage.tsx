import { Link } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import {
  adPolisurDivisionPath,
} from "@/constants/polisur-routes";
import { polisurCopy } from "@/content/polisur";
import { catalogPolisurUnits } from "@/content/polisur-site";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

export default function PolisurDivisionesPage() {
  const { site } = usePolisurSite();
  const items = catalogPolisurUnits(site);

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
            Consulte cada división y conozca más sobre su labor institucional.
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
          <div className="divide-y divide-[var(--ps-line)]">
            {items.map((item) => (
              <article
                key={item.id}
                className="grid lg:grid-cols-[1.05fr_0.95fr]"
              >
                <PolisurMedia
                  src={item.imageUrl || "/polisur/home/about.jpg"}
                  alt={item.label}
                  className="min-h-[16rem] sm:min-h-[20rem] lg:min-h-full"
                  objectPosition={item.featured ? "center 40%" : "center"}
                  overlay="soft"
                />
                <div className="flex items-center px-5 py-10 sm:px-10 sm:py-14">
                  <div className="max-w-xl">
                    <p className="ps-eyebrow">División</p>
                    <h2 className="mt-3 text-3xl text-[var(--ps-white)] sm:text-4xl">
                      {item.label}
                    </h2>
                    {item.summary ? (
                      <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
                        {item.summary}
                      </p>
                    ) : null}
                    <Link
                      to={adPolisurDivisionPath(item.id)}
                      className="mt-8 inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ps-white)] underline-offset-4 hover:underline"
                    >
                      Acceder
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
