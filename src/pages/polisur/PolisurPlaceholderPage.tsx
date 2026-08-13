import { Link } from "react-router";
import { PageMeta } from "@/components/page/PageMeta";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";

type PolisurPlaceholderPageProps = {
  title: string;
  description: string;
};

export default function PolisurPlaceholderPage({
  title,
  description,
}: PolisurPlaceholderPageProps) {
  return (
    <>
      <PageMeta title={`${title} — POLISUR`} description={description} />
      <section className="ps-container max-w-3xl py-16 sm:py-20">
        <p className="ps-eyebrow">En preparación</p>
        <h1 className="mt-3 text-4xl text-[var(--ps-white)]">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--ps-steel-300)]">
          {description}
        </p>
        <p className="mt-3 text-sm text-[var(--ps-steel-400)]">
          El contenido oficial de esta sección se publicará cuando esté
          validado por la institución.
        </p>
        <Link
          to={POLISUR_ROUTES.home}
          className="ps-btn ps-btn-ghost mt-8"
        >
          Volver al inicio
        </Link>
      </section>
    </>
  );
}
