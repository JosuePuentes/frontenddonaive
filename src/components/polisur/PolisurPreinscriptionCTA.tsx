import { Link } from "react-router";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { polisurCopy } from "@/content/polisur";

function PolisurPreinscriptionCTA() {
  return (
    <section
      className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]"
      aria-labelledby="polisur-preinscripcion-title"
    >
      <div className="ps-container flex flex-col gap-8 border-l-2 border-[var(--ps-gold)] py-14 pl-5 sm:flex-row sm:items-end sm:justify-between sm:py-16 sm:pl-8">
        <div className="max-w-xl">
          <p className="ps-eyebrow">Aspirantes</p>
          <h2
            id="polisur-preinscripcion-title"
            className="mt-3 text-3xl uppercase leading-tight tracking-wide text-[var(--ps-white)] sm:text-4xl"
          >
            {polisurCopy.preinscripcion.title}
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)]">
            {polisurCopy.preinscripcion.body}
          </p>
        </div>
        <Link
          to={POLISUR_ROUTES.preinscripcion}
          className="ps-btn ps-btn-primary shrink-0"
        >
          {polisurCopy.preinscripcion.cta}
        </Link>
      </div>
    </section>
  );
}

export { PolisurPreinscriptionCTA };
