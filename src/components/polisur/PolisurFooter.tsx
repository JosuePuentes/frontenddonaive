import { Link } from "react-router";
import { POLISUR_ROUTES, polisurNavItems } from "@/constants/polisur-routes";
import { polisurCopy } from "@/content/polisur";

function PolisurFooter() {
  return (
    <footer className="bg-[var(--ps-navy-950)]">
      <div className="ps-container grid gap-10 border-t border-[var(--ps-line)] py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="ps-display text-xl text-[var(--ps-white)]">
            {polisurCopy.brand.name}
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--ps-steel-400)]">
            {polisurCopy.brand.line}. La información de contacto, redes y
            ubicación oficial se publicará cuando esté validada.
          </p>
        </div>

        <div>
          <h3 className="ps-eyebrow">Navegación</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ps-steel-300)]">
            {polisurNavItems.map((item) => (
              <li key={item.key}>
                <Link to={item.to} className="hover:text-[var(--ps-white)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="ps-eyebrow">Institucional</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ps-steel-300)]">
            <li>
              <Link
                to={POLISUR_ROUTES.contacto}
                className="hover:text-[var(--ps-white)]"
              >
                Contacto
              </Link>
            </li>
            <li className="text-[var(--ps-steel-400)]">
              Política de privacidad
            </li>
            <li className="text-[var(--ps-steel-400)]">Términos</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--ps-line)]">
        <div className="ps-container flex flex-col gap-2 py-5 text-xs text-[var(--ps-steel-400)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {polisurCopy.brand.name}</span>
          <span>Portal institucional</span>
        </div>
      </div>
    </footer>
  );
}

export { PolisurFooter };
