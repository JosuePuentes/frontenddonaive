import { useState } from "react";
import { Link, NavLink } from "react-router";
import { Menu, X } from "lucide-react";
import {
  POLISUR_ROUTES,
  polisurNavItems,
} from "@/constants/polisur-routes";

function PolisurNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--polisur-line)] bg-[rgba(7,16,24,0.92)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
        <Link
          to={POLISUR_ROUTES.home}
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-[var(--polisur-gold)]/50 bg-[var(--polisur-navy-mid)] text-[0.65rem] font-semibold tracking-[0.12em] text-[var(--polisur-gold-soft)]"
          >
            PS
          </span>
          <div className="leading-tight">
            <div className="polisur-display text-base font-bold text-[var(--polisur-white)] sm:text-lg">
              POLISUR
            </div>
            <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--polisur-steel)]">
              {/* PLACEHOLDER — eslogan oficial pendiente */}
              Identidad institucional
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {polisurNavItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-sm px-3 py-2 text-sm font-medium transition-colors",
                  isActive && !item.to.includes("#")
                    ? "text-[var(--polisur-gold-soft)]"
                    : "text-[var(--polisur-mist)]/85 hover:text-[var(--polisur-white)]",
                ].join(" ")
              }
              end={item.to === POLISUR_ROUTES.home}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--polisur-line)] text-[var(--polisur-mist)] md:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <nav
          className="border-t border-[var(--polisur-line)] bg-[var(--polisur-ink)] px-4 py-3 md:hidden"
          aria-label="Móvil"
        >
          <ul className="flex flex-col gap-1">
            {polisurNavItems.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="block rounded-sm px-3 py-3 text-sm font-medium text-[var(--polisur-mist)] hover:bg-[var(--polisur-slate)]"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export { PolisurNavbar };
