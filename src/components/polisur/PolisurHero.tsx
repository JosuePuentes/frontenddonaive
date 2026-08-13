import { Link } from "react-router";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";

function PolisurHero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Plano visual full-bleed — reemplazable por fotografía institucional */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 70% 20%, rgba(201,162,39,0.18) 0%, transparent 45%), linear-gradient(135deg, #071018 0%, #0a1628 42%, #132842 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="mx-auto grid min-h-[calc(100svh-4.25rem)] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:px-8 lg:py-20">
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--polisur-gold)]">
            Portal institucional
          </p>
          <h1 className="polisur-display text-5xl font-bold text-[var(--polisur-white)] sm:text-6xl lg:text-7xl">
            POLISUR
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--polisur-mist)]/90 sm:text-lg">
            Seguridad, prevención y servicio con compromiso ciudadano.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to={POLISUR_ROUTES.divisiones}
              className="inline-flex h-12 items-center justify-center rounded-sm bg-[var(--polisur-gold)] px-6 text-sm font-semibold text-[var(--polisur-ink)] transition hover:bg-[var(--polisur-gold-soft)]"
            >
              Conoce nuestras divisiones
            </Link>
            <Link
              to={POLISUR_ROUTES.preinscripcion}
              className="inline-flex h-12 items-center justify-center rounded-sm border border-[var(--polisur-mist)]/35 px-6 text-sm font-semibold text-[var(--polisur-white)] transition hover:border-[var(--polisur-gold)] hover:text-[var(--polisur-gold-soft)]"
            >
              Preinscríbete
            </Link>
          </div>
        </div>

        <div className="relative min-h-[16rem] overflow-hidden rounded-sm border border-[var(--polisur-line)] bg-[var(--polisur-navy-mid)] sm:min-h-[20rem] lg:min-h-[24rem]">
          {/* PLACEHOLDER — sustituir por fotografía institucional oficial */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--polisur-gold)]">
              Espacio fotográfico
            </span>
            <p className="max-w-xs text-sm text-[var(--polisur-steel)]">
              PLACEHOLDER: imagen institucional de alta calidad (sin inventar
              fotografía oficial).
            </p>
          </div>
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[var(--polisur-ink)] to-transparent"
          />
        </div>
      </div>
    </section>
  );
}

export { PolisurHero };
