import { Link } from "react-router";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";

function PolisurPreinscriptionCTA() {
  return (
    <section className="border-t border-[var(--polisur-line)] bg-[var(--polisur-navy-mid)]">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-xl">
          <h2 className="text-3xl text-[var(--polisur-white)] sm:text-4xl">
            ¿Quieres formar parte de POLISUR?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--polisur-mist)]/85">
            Si te motiva el servicio público, la disciplina y el compromiso con
            la comunidad, prepara tu postulación a través del proceso de
            preinscripción.
          </p>
        </div>
        <Link
          to={POLISUR_ROUTES.preinscripcion}
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-sm bg-[var(--polisur-gold)] px-6 text-sm font-semibold text-[var(--polisur-ink)] transition hover:bg-[var(--polisur-gold-soft)]"
        >
          Realizar preinscripción
        </Link>
      </div>
    </section>
  );
}

export { PolisurPreinscriptionCTA };
