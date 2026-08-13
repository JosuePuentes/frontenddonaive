import { Link } from "react-router";
import { polisurDivisionItems } from "@/content/polisur";

function PolisurDivisions() {
  return (
    <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]">
      <div className="ps-container py-14 sm:py-20">
        <div className="max-w-xl">
          <p className="ps-eyebrow">Organización</p>
          <h2 className="mt-3 text-3xl text-[var(--ps-white)] sm:text-4xl">
            Divisiones
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-400)] sm:text-base">
            Presentación preliminar de unidades. El listado oficial se
            actualizará con la información institucional validada.
          </p>
        </div>

        <div className="mt-10 divide-y divide-[var(--ps-line)] border-y border-[var(--ps-line)]">
          {polisurDivisionItems.map((item) => (
            <article
              key={item.key}
              className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl text-[var(--ps-white)]">{item.name}</h3>
                  {item.featured ? (
                    <span className="text-[0.65rem] font-semibold tracking-[0.16em] text-[var(--ps-gold)]">
                      DESTACADA
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ps-steel-400)]">
                  {item.summary}
                </p>
              </div>
              <Link
                to={item.to}
                className="text-sm font-semibold tracking-wide text-[var(--ps-paper)] underline-offset-4 hover:underline"
              >
                Ver unidad
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export { PolisurDivisions };
