import { Link, useSearchParams } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurCrest } from "@/components/polisur/PolisurCrest";
import { PolisurMark } from "@/components/polisur/PolisurMark";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

export default function PolisurPreinscripcion() {
  const [params] = useSearchParams();
  const isCanina = params.get("unidad") === "canina";

  return (
    <>
      <PageMeta
        title={
          isCanina
            ? "Preinscripción Unidad Canina — POLISUR"
            : "Preinscripción — POLISUR"
        }
        description="Canal de preinscripción para aspirantes a POLISUR."
      />

      <section
        className={
          isCanina
            ? "ps-canina-stage border-b border-[var(--ps-line)]"
            : "border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]"
        }
      >
        <div className="ps-container py-14 sm:py-20">
          <div className="flex items-start gap-4">
            {isCanina ? (
              <span className="relative inline-flex h-16 w-16 shrink-0 overflow-hidden sm:h-20 sm:w-20">
                <PolisurMark
                  src={POLISUR_MEDIA.k9}
                  alt="Unidad de Patrullaje Canino"
                  className="h-full w-full"
                />
              </span>
            ) : (
              <PolisurCrest size="lg" />
            )}
            <div className="max-w-xl">
              <p className="ps-eyebrow text-[var(--ps-gold)]">
                {isCanina ? "Unidad de Patrullaje Canino" : "Aspirantes"}
              </p>
              <h1 className="mt-3 text-3xl uppercase tracking-wide text-[var(--ps-white)] sm:text-5xl">
                {isCanina
                  ? "Preinscripción Unidad Canina"
                  : "Preinscripción"}
              </h1>
              <hr className="ps-gold-rule mt-6" />
              <p className="mt-6 text-sm leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
                {isCanina
                  ? "Canal de preinscripción para aspirantes a la Unidad Canina. El formulario y la conexión con backend se implementarán en una fase posterior."
                  : polisurCopy.preinscripcion.body}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!isCanina ? (
        <section className="bg-[var(--ps-navy-900)]">
          <div className="ps-container grid gap-px bg-[var(--ps-line)] py-0 sm:grid-cols-2">
            <article className="bg-[var(--ps-navy-900)] px-5 py-10 sm:px-8 sm:py-14">
              <p className="ps-eyebrow">Institución</p>
              <h2 className="mt-3 text-2xl text-[var(--ps-white)]">
                Preinscripción general
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-400)]">
                Proceso de aspirantes a POLISUR. El formulario oficial se
                publicará cuando esté validado.
              </p>
            </article>

            <article className="bg-[var(--ps-navy-950)] px-5 py-10 sm:px-8 sm:py-14">
              <p className="ps-eyebrow text-[var(--ps-gold)]">Especialidad</p>
              <h2 className="mt-3 text-2xl text-[var(--ps-white)]">
                Unidad Canina
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-400)]">
                Si el interés es la Unidad de Patrullaje Canino, continúe en el
                diseño institucional de esa división.
              </p>
              <Link
                to={POLISUR_ROUTES.preinscripcionCanina}
                className="ps-btn ps-btn-gold mt-8"
              >
                Continuar en Unidad Canina
              </Link>
            </article>
          </div>
        </section>
      ) : (
        <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]">
          <div className="ps-container py-12 sm:py-16">
            <p className="max-w-xl text-sm leading-relaxed text-[var(--ps-steel-300)]">
              Esta vía queda identificada con la Unidad Canina. Los requisitos
              y el formulario oficiales se publicarán cuando la institución los
              valide.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={POLISUR_ROUTES.unidadCanina}
                className="ps-btn ps-btn-ghost"
              >
                Volver a la Unidad
              </Link>
              <Link
                to={POLISUR_ROUTES.preinscripcion}
                className="ps-btn ps-btn-ghost"
              >
                Preinscripción general
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
