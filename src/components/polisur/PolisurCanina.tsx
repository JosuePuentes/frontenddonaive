import { Link } from "react-router";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function PolisurCanina() {
  return (
    <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-950)]">
      <div className="grid lg:grid-cols-2">
        <PolisurMedia
          src={POLISUR_MEDIA.home.canina}
          alt="Unidad Canina"
          className="min-h-[18rem] sm:min-h-[22rem] lg:min-h-[28rem]"
          objectPosition="center"
          overlay="soft"
        />

        <div className="flex items-center bg-[var(--ps-navy-800)] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="max-w-md">
            <p className="ps-eyebrow">División destacada</p>
            <h2 className="mt-3 text-3xl text-[var(--ps-white)] sm:text-5xl">
              {polisurCopy.canina.title}
            </h2>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-[var(--ps-steel-300)] sm:text-base">
              {polisurCopy.canina.body}
            </p>
            <Link
              to={POLISUR_ROUTES.unidadCanina}
              className="ps-btn ps-btn-primary mt-8"
            >
              {polisurCopy.canina.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export { PolisurCanina };
