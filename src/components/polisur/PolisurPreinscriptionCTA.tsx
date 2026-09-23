import { Link } from "react-router";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";

function PolisurPreinscriptionCTA() {
  const { site } = usePolisurSite();
  const block = site.home.preinscripcion;

  return (
    <section
      className="ps-surface-mint border-b border-[var(--ps-line)]"
      aria-labelledby="polisur-preinscripcion-title"
    >
      <div className="ps-container flex flex-col gap-8 border-l-2 border-[var(--ps-mint)] py-14 pl-5 sm:flex-row sm:items-end sm:justify-between sm:py-16 sm:pl-8">
        <div className="max-w-xl">
          <p className="ps-eyebrow">{block.eyebrow}</p>
          <h2
            id="polisur-preinscripcion-title"
            className="mt-3 text-3xl uppercase leading-tight tracking-wide text-[var(--ps-white)] sm:text-4xl"
          >
            {block.title}
          </h2>
          <p className="mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)]">
            {block.body}
          </p>
        </div>
        <Link
          to={POLISUR_ROUTES.preinscripcion}
          className="ps-btn ps-btn-primary shrink-0"
        >
          {block.cta}
        </Link>
      </div>
    </section>
  );
}

export { PolisurPreinscriptionCTA };
