import { Link } from "react-router";
import { polisurAccessItems } from "@/content/polisur";

function PolisurAccess() {
  return (
    <section className="border-b border-[var(--ps-line)] bg-[var(--ps-navy-900)]">
      <div className="ps-container py-10 sm:py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="ps-eyebrow">Accesos</p>
            <h2 className="mt-2 text-2xl text-[var(--ps-white)] sm:text-3xl">
              Servicios institucionales
            </h2>
          </div>
        </div>

        <ul className="grid gap-px bg-[var(--ps-line)] sm:grid-cols-2 lg:grid-cols-5">
          {polisurAccessItems.map((item) => (
            <li key={item.key} className="bg-[var(--ps-navy-900)]">
              <Link
                to={item.to}
                className="group flex h-full flex-col justify-between px-4 py-5 transition-colors hover:bg-[var(--ps-navy-800)] sm:px-5 sm:py-6"
              >
                <span>
                  <span className="block text-sm font-semibold text-[var(--ps-white)]">
                    {item.label}
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-[var(--ps-steel-400)]">
                    {item.description}
                  </span>
                </span>
                <span className="mt-5 text-xs font-semibold tracking-[0.12em] text-[var(--ps-steel-300)] group-hover:text-[var(--ps-gold)]">
                  INGRESAR →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export { PolisurAccess };
