import { Link, useParams } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

export default function PolisurDivisionDetalle() {
  const { divisionId = "" } = useParams();
  const { site } = usePolisurSite();
  const item = site.units.find((u) => u.id === divisionId && u.label);

  if (!item) {
    return (
      <section className="bg-[var(--ps-navy-900)]">
        <div className="ps-container py-20">
          <p className="text-sm text-[var(--ps-steel-400)]">
            División no encontrada.
          </p>
          <Link
            to={POLISUR_ROUTES.divisiones}
            className="mt-4 inline-flex text-sm text-[var(--ps-mint)] underline"
          >
            Volver a divisiones
          </Link>
        </div>
      </section>
    );
  }

  const preinscripcionHref = `${POLISUR_ROUTES.preinscripcion}?unidad=${encodeURIComponent(item.id)}`;

  return (
    <>
      <PageMeta
        title={`${item.label} — POLISUR`}
        description={item.summary || item.functions || item.label}
      />
      <section className="relative min-h-[42vh] overflow-hidden border-b border-[var(--ps-line)]">
        <PolisurMedia
          src={item.imageUrl || "/polisur/home/about.jpg"}
          alt={item.label}
          className="absolute inset-0 h-full w-full"
          overlay="strong"
          objectPosition={item.featured ? "center 40%" : "center"}
          priority
        />
        <div className="relative z-[1] ps-container flex min-h-[42vh] flex-col justify-end py-12 sm:py-16">
          <Link
            to={POLISUR_ROUTES.divisiones}
            className="ps-eyebrow text-[var(--ps-mint)] hover:underline"
          >
            Divisiones
          </Link>
          <h1 className="mt-3 max-w-3xl text-3xl text-[var(--ps-white)] sm:text-5xl">
            {item.label}
          </h1>
          {item.summary ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ps-paper)]/92 sm:text-base">
              {item.summary}
            </p>
          ) : null}
        </div>
      </section>

      <section className="bg-[var(--ps-navy-900)]">
        <div className="ps-container max-w-3xl py-12 sm:py-16">
          {item.functions ? (
            <div>
              <p className="ps-eyebrow">Funciones</p>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
                {item.functions}
              </p>
            </div>
          ) : null}

          <div className={item.functions ? "mt-10 flex flex-wrap gap-6" : "flex flex-wrap gap-6"}>
            {item.active ? (
              <Link
                to={preinscripcionHref}
                className="inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ps-mint)] underline-offset-4 hover:underline"
              >
                Preinscripción
              </Link>
            ) : null}
            <Link
              to={POLISUR_ROUTES.divisiones}
              className="inline-flex text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ps-paper)] underline-offset-4 hover:underline"
            >
              Todas las divisiones
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
