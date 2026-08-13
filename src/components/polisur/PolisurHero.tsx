import { Link } from "react-router";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function PolisurHero() {
  return (
    <section className="relative isolate min-h-[78svh] overflow-hidden sm:min-h-[85svh]">
      <PolisurMedia
        src={POLISUR_MEDIA.home.hero}
        alt="Imagen institucional de POLISUR"
        className="absolute inset-0"
        objectPosition="center 30%"
        overlay="strong"
      />

      <div className="relative flex min-h-[78svh] items-end sm:min-h-[85svh]">
        <div className="ps-container w-full pb-12 pt-24 sm:pb-16 sm:pt-28">
          <div className="max-w-xl border-l-2 border-[var(--ps-gold)] pl-4 sm:pl-5">
            <h1 className="ps-display text-[2.75rem] leading-[1.05] text-[var(--ps-white)] sm:text-6xl">
              {polisurCopy.hero.title}
            </h1>
            <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-[var(--ps-paper)]/90 sm:text-base">
              {polisurCopy.hero.message}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={POLISUR_ROUTES.institucion}
                className="ps-btn ps-btn-primary"
              >
                {polisurCopy.hero.ctaPrimary}
              </Link>
              <Link
                to={POLISUR_ROUTES.preinscripcion}
                className="ps-btn ps-btn-ghost"
              >
                {polisurCopy.hero.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { PolisurHero };
