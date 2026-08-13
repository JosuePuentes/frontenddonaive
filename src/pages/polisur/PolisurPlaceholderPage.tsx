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
      <PageMeta
        title={`${title} — POLISUR`}
        description={description}
      />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--polisur-gold)]">
          En preparación
        </p>
        <h1 className="mt-3 text-4xl text-[var(--polisur-white)]">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--polisur-mist)]/85">
          {description}
        </p>
        <p className="mt-3 text-sm text-[var(--polisur-steel)]">
          PLACEHOLDER: esta sección se completará con contenido oficial. No
          incluye formularios ni datos inventados en esta fase.
        </p>
        <Link
          to={POLISUR_ROUTES.home}
          className="mt-8 inline-flex h-11 items-center justify-center rounded-sm border border-[var(--polisur-line)] px-5 text-sm font-semibold text-[var(--polisur-white)] hover:border-[var(--polisur-gold)]"
        >
          Volver al inicio
        </Link>
      </section>
    </>
  );
}
