import { Link } from "react-router";
import { usePolisurTheme } from "@/components/polisur/usePolisurTheme";
import { POLISUR_ROUTES, polisurNavItems } from "@/constants/polisur-routes";
import { polisurCopy } from "@/content/polisur";

function PolisurFooter() {
  const { isCanina } = usePolisurTheme();

  return (
    <footer className="bg-[var(--ps-navy-900)]">
      <div className="ps-container grid gap-10 border-t border-[var(--ps-line)] py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="ps-display text-xl text-[var(--ps-white)]">
            {isCanina ? "Unidad Canina" : polisurCopy.brand.name}
          </div>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--ps-mint)]">
            {isCanina ? polisurCopy.brand.name : polisurCopy.brand.line}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--ps-steel-300)]">
            {polisurCopy.brand.identification}
          </p>
        </div>

        <div>
          <h3 className="ps-eyebrow">Enlaces</h3>
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
          <h3 className="ps-eyebrow">Contacto</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-[var(--ps-steel-300)]">
            <li>
              <Link
                to={POLISUR_ROUTES.contacto}
                className="hover:text-[var(--ps-white)]"
              >
                Ir a contacto
              </Link>
            </li>
            <li>{polisurCopy.footer.contactNote}</li>
          </ul>
        </div>

        <div>
          <h3 className="ps-eyebrow">{polisurCopy.footer.attention}</h3>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)]">
            {polisurCopy.footer.attentionNote}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--ps-steel-300)]">
            {polisurCopy.footer.socialNote}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--ps-line)]">
        <div className="ps-container flex flex-col gap-2 py-5 text-xs text-[var(--ps-steel-400)] sm:flex-row sm:items-center sm:justify-between">
          <span>© {polisurCopy.brand.name}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Portal institucional</span>
            <Link
              to={POLISUR_ROUTES.medios}
              className="text-[var(--ps-steel-400)] underline-offset-4 hover:text-[var(--ps-mint)] hover:underline"
            >
              Acceso institucional
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export { PolisurFooter };
