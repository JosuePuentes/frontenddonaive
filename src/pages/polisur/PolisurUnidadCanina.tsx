import { Link } from "react-router";
import { useState } from "react";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurMark } from "@/components/polisur/PolisurMark";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

export default function PolisurUnidadCanina() {
  const { site } = usePolisurSite();
  const unit = site.units.find((u) => u.id === "unidad-canina");
  const [binomioFailed, setBinomioFailed] = useState(false);

  const summary = unit?.summary?.trim() || polisurCopy.canina.body;
  const functions = unit?.functions?.trim() || "";
  const imageSrc =
    unit?.imageUrl ||
    POLISUR_MEDIA.home.canina ||
    POLISUR_MEDIA.unidadCanina.hero;

  return (
    <>
      <PageMeta
        title="Unidad Canina — POLISUR"
        description={summary}
      />

      <section className="ps-canina-stage border-b border-[var(--ps-line)]">
        <div className="ps-container relative grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-6 lg:py-10">
          <div className="relative z-[1] max-w-md pb-4 lg:pb-16">
            <p className="ps-eyebrow text-[var(--ps-mint)]">
              {polisurCopy.canina.eyebrow}
            </p>
            <h1 className="ps-display mt-3 text-4xl uppercase tracking-wide text-[var(--ps-white)] sm:text-6xl">
              {unit?.label || "Unidad Canina"}
            </h1>
            <hr className="ps-gold-rule mt-6" />
            <p className="mt-6 text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {summary}
            </p>
            {unit?.active !== false ? (
              <Link
                to={POLISUR_ROUTES.preinscripcionCanina}
                className="ps-btn ps-btn-ghost mt-8"
              >
                Preinscripción
              </Link>
            ) : null}
          </div>

          <div className="relative">
            <div className="ps-canina-stage__crest" aria-hidden>
              <PolisurMark
                src={POLISUR_MEDIA.k9}
                alt=""
                className="h-16 w-16 object-contain sm:h-20 sm:w-20"
              />
            </div>
            <div className="ps-canina-stage__frame">
              {!binomioFailed ? (
                <img
                  src={POLISUR_MEDIA.unidadCanina.binomio}
                  alt="Binomio Unidad Canina POLISUR"
                  className="ps-canina-binomio"
                  onError={() => setBinomioFailed(true)}
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <PolisurMedia
                  src={imageSrc}
                  alt="Unidad Canina POLISUR"
                  className="min-h-[18rem] w-full sm:min-h-[24rem]"
                  overlay="soft"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {functions ? (
        <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]">
          <div className="ps-container grid gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="ps-eyebrow">Funciones</p>
              <h2 className="mt-3 text-2xl text-[var(--ps-white)] sm:text-3xl">
                Labor de la Unidad
              </h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
                {functions}
              </p>
            </div>
            <PolisurMedia
              src={imageSrc}
              alt="Unidad Canina POLISUR"
              className="min-h-[14rem] sm:min-h-[18rem]"
              overlay="soft"
            />
          </div>
        </section>
      ) : null}

      <section className="bg-[var(--ps-navy-950)]">
        <div className="ps-container py-10 sm:py-12">
          <Link
            to={POLISUR_ROUTES.divisiones}
            className="inline-flex text-sm font-semibold text-[var(--ps-paper)] underline-offset-4 hover:underline"
          >
            Volver a divisiones
          </Link>
        </div>
      </section>
    </>
  );
}
