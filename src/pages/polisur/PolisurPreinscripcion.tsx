import { Link, useSearchParams } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
import { PolisurCrest } from "@/components/polisur/PolisurCrest";
import { PolisurMark } from "@/components/polisur/PolisurMark";
import { PolisurPreinscripcionForm } from "@/components/polisur/PolisurPreinscripcionForm";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";
import { unitFromSearchParam } from "@/content/polisur-preinscripcion";

export default function PolisurPreinscripcion() {
  const [params] = useSearchParams();
  const isCanina = params.get("unidad") === "canina";
  const defaultUnidad = unitFromSearchParam(params.get("unidad"));

  return (
    <>
      <PageMeta
        title={
          isCanina
            ? "Preinscripción Unidad Canina — POLISUR"
            : "Preinscripción — POLISUR"
        }
        description="Formulario de preinscripción para aspirantes a POLISUR."
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
                  ? "Complete el formulario para registrar su interés en la Unidad Canina. Los datos serán revisados por la institución."
                  : polisurCopy.preinscripcion.body}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]">
        <div className="ps-container grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <p className="ps-eyebrow">Formulario</p>
            <h2 className="mt-3 text-2xl text-[var(--ps-white)]">
              Datos del aspirante
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--ps-steel-400)]">
              Indique sus nombres, correo, teléfono y la unidad a la que desea
              pertenecer. Este registro no constituye ingreso automático.
            </p>
            {isCanina ? (
              <Link
                to={POLISUR_ROUTES.preinscripcion}
                className="ps-btn ps-btn-ghost mt-8"
              >
                Preinscripción general
              </Link>
            ) : (
              <Link
                to={POLISUR_ROUTES.preinscripcionCanina}
                className="ps-btn ps-btn-gold mt-8"
              >
                Prefiero Unidad Canina
              </Link>
            )}
          </div>
          <PolisurPreinscripcionForm defaultUnidad={defaultUnidad} />
        </div>
      </section>
    </>
  );
}
