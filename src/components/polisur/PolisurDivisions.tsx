import { Link } from "react-router";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";

const divisions = [
  {
    id: "unidad-canina",
    name: "Unidad Canina",
    description:
      "Disciplina, entrenamiento y servicio con binomios caninos especializados.",
    featured: true,
    to: POLISUR_ROUTES.unidadCanina,
    cta: "Conocer unidad",
  },
  {
    id: "placeholder-1",
    name: "División operativa",
    description:
      "PLACEHOLDER: descripción oficial de la división pendiente.",
    featured: false,
    to: POLISUR_ROUTES.divisiones,
    cta: "Ver divisiones",
  },
  {
    id: "placeholder-2",
    name: "División preventiva",
    description:
      "PLACEHOLDER: descripción oficial de la división pendiente.",
    featured: false,
    to: POLISUR_ROUTES.divisiones,
    cta: "Ver divisiones",
  },
] as const;

function PolisurDivisions() {
  return (
    <section className="border-t border-[var(--polisur-line)] bg-[var(--polisur-ink)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--polisur-gold)]">
            Organización
          </p>
          <h2 className="mt-3 text-3xl text-[var(--polisur-white)] sm:text-4xl">
            Nuestras divisiones
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--polisur-steel)] sm:text-base">
            {/* PLACEHOLDER — catálogo oficial de divisiones pendiente */}
            Vista preliminar. Solo la Unidad Canina tiene recorrido preparado;
            el resto son placeholders hasta contar con datos oficiales.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {divisions.map((division) => (
            <article
              key={division.id}
              className={[
                "flex flex-col border p-5 sm:p-6",
                division.featured
                  ? "border-[var(--polisur-gold)]/45 bg-[var(--polisur-navy-mid)]"
                  : "border-[var(--polisur-line)] bg-[var(--polisur-slate)]/40",
              ].join(" ")}
            >
              <h3 className="text-xl text-[var(--polisur-white)]">
                {division.name}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--polisur-mist)]/80">
                {division.description}
              </p>
              <Link
                to={division.to}
                className="mt-6 inline-flex text-sm font-semibold text-[var(--polisur-gold-soft)] underline-offset-4 hover:underline"
              >
                {division.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export { PolisurDivisions };
