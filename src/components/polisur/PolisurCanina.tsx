import { Link } from "react-router";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";

function PolisurCanina() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--polisur-line)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(105deg, #0a1628 0%, #132842 55%, #1a2433 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[var(--polisur-gold)]/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--polisur-gold)]">
            Destacada
          </p>
          <h2 className="mt-3 text-3xl text-[var(--polisur-white)] sm:text-5xl">
            Unidad Canina
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--polisur-mist)]/90 sm:text-lg">
            Disciplina, entrenamiento y servicio.
          </p>
          <Link
            to={POLISUR_ROUTES.unidadCanina}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-sm bg-[var(--polisur-white)] px-6 text-sm font-semibold text-[var(--polisur-ink)] transition hover:bg-[var(--polisur-mist)]"
          >
            Conocer la Unidad Canina
          </Link>
        </div>

        <div className="relative min-h-[14rem] border border-[var(--polisur-line)] bg-[var(--polisur-ink)]/50 sm:min-h-[18rem]">
          {/* PLACEHOLDER visual — sin inventar escudos ni fotos oficiales */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--polisur-gold)]">
              Recurso visual
            </span>
            <p className="max-w-xs text-sm text-[var(--polisur-steel)]">
              PLACEHOLDER: fotografía o material oficial de la Unidad Canina.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export { PolisurCanina };
