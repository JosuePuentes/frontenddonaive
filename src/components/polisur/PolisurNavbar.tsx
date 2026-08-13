import { Link, NavLink } from "react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { PolisurCrest } from "@/components/polisur/PolisurCrest";
import {
  POLISUR_ROUTES,
  polisurNavItems,
} from "@/constants/polisur-routes";
import { polisurCopy } from "@/content/polisur";

function PolisurNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ps-line)] bg-[rgba(5,10,18,0.94)] backdrop-blur-md">
      <div className="ps-container flex h-[3.75rem] items-center justify-between sm:h-[4.25rem]">
        <Link
          to={POLISUR_ROUTES.home}
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <PolisurCrest size="md" />
          <span className="min-w-0 leading-tight">
            <span className="ps-display block truncate text-[1.1rem] text-[var(--ps-white)] sm:text-xl">
              {polisurCopy.brand.name}
            </span>
            <span className="block truncate text-[0.62rem] uppercase tracking-[0.14em] text-[var(--ps-steel-400)] sm:text-[0.65rem]">
              {polisurCopy.brand.line}
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 xl:flex"
          aria-label="Principal"
        >
          {polisurNavItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === POLISUR_ROUTES.home}
              className={({ isActive }) =>
                [
                  "px-2.5 py-2 text-[0.78rem] font-medium tracking-[0.04em] uppercase transition-colors",
                  isActive && !item.to.includes("#")
                    ? "text-[var(--ps-white)]"
                    : "text-[var(--ps-steel-300)] hover:text-[var(--ps-white)]",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-[1px] border border-[var(--ps-line)] text-[var(--ps-paper)] xl:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <nav
          className="border-t border-[var(--ps-line)] bg-[var(--ps-navy-950)] xl:hidden"
          aria-label="Móvil"
        >
          <ul className="ps-container flex flex-col py-2">
            {polisurNavItems.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="block border-b border-[var(--ps-line)] px-1 py-3.5 text-sm font-medium tracking-wide text-[var(--ps-paper)] last:border-b-0"
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
