import { useState } from "react";
import { Link } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurMark } from "@/components/polisur/PolisurMark";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

const futureSections = [
  { key: "identidad", label: "Identidad de la división" },
  { key: "funciones", label: "Funciones" },
  { key: "entrenamiento", label: "Entrenamiento" },
  { key: "especialidades", label: "Especialidades" },
  { key: "caninos", label: "Caninos" },
  { key: "guias", label: "Guías" },
  { key: "galeria", label: "Galería" },
  { key: "requisitos", label: "Requisitos para aspirantes" },
] as const;

export default function PolisurUnidadCanina() {
  const [binomioFailed, setBinomioFailed] = useState(false);

  return (
    <>
      <PageMeta
        title="Unidad Canina — POLISUR"
        description="Unidad Canina de POLISUR: especialidad institucional, entrenamiento y servicio."
      />

      <section className="ps-canina-stage border-b border-[var(--ps-line)]">
        <div className="ps-container relative grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-6 lg:py-10">
          <div className="relative z-[1] max-w-md pb-4 lg:pb-16">
            <p className="ps-eyebrow text-[var(--ps-mint)]">POLISUR</p>
            <h1 className="ps-display mt-3 text-4xl uppercase tracking-wide text-[var(--ps-white)] sm:text-6xl">
              Unidad Canina
            </h1>
            <hr className="ps-gold-rule mt-6" />
            <p className="mt-6 text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {polisurCopy.canina.body}
            </p>
            <Link
              to={POLISUR_ROUTES.preinscripcionCanina}
              className="ps-btn ps-btn-ghost mt-8"
            >
              Preinscripción
            </Link>
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
                  src={POLISUR_MEDIA.unidadCanina.hero}
                  alt="Unidad Canina POLISUR"
                  className="min-h-[18rem] w-full sm:min-h-[24rem]"
                  overlay="soft"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]">
        <div className="ps-container grid gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl text-[var(--ps-white)] sm:text-3xl">
              Presentación
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              Esta página está preparada para recibir la identidad visual y el
              contenido oficial de la Unidad Canina: misión de la división,
              funciones, entrenamiento, especialidades, caninos, guías y
              galería fotográfica.
            </p>
          </div>

          <PolisurMedia
            src={POLISUR_MEDIA.unidadCanina.entrenamiento}
            alt="Entrenamiento Unidad Canina"
            className="min-h-[14rem] sm:min-h-[18rem]"
            overlay="soft"
          />
        </div>
      </section>

      <section className="bg-[var(--ps-navy-950)]">
        <div className="ps-container py-12 sm:py-16">
          <p className="ps-eyebrow">Arquitectura de contenido</p>
          <h2 className="mt-3 text-2xl text-[var(--ps-white)]">
            Próximas secciones
          </h2>
          <ul className="mt-8 grid gap-px bg-[var(--ps-line)] sm:grid-cols-2">
            {futureSections.map((section) => (
              <li
                key={section.key}
                className="bg-[var(--ps-navy-950)] px-4 py-4 text-sm text-[var(--ps-steel-300)]"
              >
                {section.label}
              </li>
            ))}
          </ul>
          <Link
            to={POLISUR_ROUTES.home}
            className="mt-8 inline-flex text-sm font-semibold text-[var(--ps-paper)] underline-offset-4 hover:underline"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </>
  );
}
