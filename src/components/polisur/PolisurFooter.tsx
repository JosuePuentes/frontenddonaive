import { Link } from "react-router";
import { POLISUR_ROUTES, polisurNavItems } from "@/constants/polisur-routes";

function PolisurFooter() {
  return (
    <footer className="border-t border-[var(--polisur-line)] bg-[var(--polisur-ink)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <div className="polisur-display text-xl font-bold text-[var(--polisur-white)]">
            POLISUR
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--polisur-steel)]">
            {/* PLACEHOLDER — datos de contacto oficiales pendientes */}
            Portal institucional. Redes, contacto y ubicación oficial se
            publicarán cuando sean validados.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--polisur-gold)]">
            Enlaces
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-[var(--polisur-mist)]/85">
            {polisurNavItems.map((item) => (
              <li key={item.key}>
                <Link to={item.to} className="hover:text-[var(--polisur-white)]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--polisur-gold)]">
            Legal
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-[var(--polisur-mist)]/85">
            <li>
              <span className="text-[var(--polisur-steel)]">
                PLACEHOLDER: Política de privacidad
              </span>
            </li>
            <li>
              <span className="text-[var(--polisur-steel)]">
                PLACEHOLDER: Términos
              </span>
            </li>
            <li>
              <Link
                to={POLISUR_ROUTES.contacto}
                className="hover:text-[var(--polisur-white)]"
              >
                Contacto institucional
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--polisur-line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-[var(--polisur-steel)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© POLISUR — Contenido institucional en preparación</span>
          <span>PLACEHOLDER: redes sociales oficiales</span>
        </div>
      </div>
    </footer>
  );
}

export { PolisurFooter };
