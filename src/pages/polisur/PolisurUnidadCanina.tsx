import { Link } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
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
  return (
    <>
      <PageMeta
        title="Unidad Canina — POLISUR"
        description="Unidad Canina de POLISUR: especialidad institucional, entrenamiento y servicio."
      />

      <section className="relative isolate min-h-[58svh] overflow-hidden sm:min-h-[68svh]">
        <PolisurMedia
          src={POLISUR_MEDIA.unidadCanina.hero}
          alt="Unidad Canina POLISUR"
          className="absolute inset-0"
          objectPosition="center"
          overlay="strong"
        />
        <div className="relative flex min-h-[58svh] items-end sm:min-h-[68svh]">
          <div className="ps-container w-full pb-10 pt-20 sm:pb-14">
            <p className="ps-eyebrow">POLISUR</p>
            <h1 className="ps-display mt-3 text-4xl text-[var(--ps-white)] sm:text-6xl">
              Unidad Canina
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--ps-paper)]/90 sm:text-base">
              {polisurCopy.canina.body}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]">
        <div className="ps-container grid gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:items-start">
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
            <Link
              to={POLISUR_ROUTES.preinscripcion}
              className="ps-btn ps-btn-ghost mt-8"
            >
              Preinscripción
            </Link>
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
