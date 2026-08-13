import { useState } from "react";
import { Link, NavLink } from "react-router";
import { Menu, X } from "lucide-react";
import {
  POLISUR_ROUTES,
  polisurNavItems,
} from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function BrandMark() {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-[var(--ps-line-strong)] bg-[var(--ps-navy-800)]">
      {!logoFailed ? (
        <img
          src={POLISUR_MEDIA.logo}
          alt=""
          className="h-full w-full object-contain p-1"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        // Reserva visual hasta disponer del escudo oficial
        <span
          aria-hidden
          className="h-5 w-5 rounded-full border border-[var(--ps-steel-400)]/50"
        />
      )}
    </span>
  );
}

function PolisurNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ps-line)] bg-[rgba(6,13,22,0.94)] backdrop-blur-md">
      <div className="ps-container flex h-14 items-center justify-between sm:h-16">
        <Link
          to={POLISUR_ROUTES.home}
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <BrandMark />
          <span className="min-w-0 leading-tight">
            <span className="ps-display block truncate text-[1.05rem] text-[var(--ps-white)] sm:text-lg">
              {polisurCopy.brand.name}
            </span>
            <span className="hidden truncate text-[0.65rem] uppercase tracking-[0.16em] text-[var(--ps-steel-400)] sm:block">
              {polisurCopy.brand.line}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Principal">
          {polisurNavItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === POLISUR_ROUTES.home}
              className={({ isActive }) =>
                [
                  "px-3 py-2 text-[0.8125rem] font-medium tracking-wide transition-colors",
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
          className="inline-flex h-10 w-10 items-center justify-center rounded-[2px] border border-[var(--ps-line)] text-[var(--ps-paper)] lg:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open ? (
        <nav
          className="border-t border-[var(--ps-line)] bg-[var(--ps-navy-950)] lg:hidden"
          aria-label="Móvil"
        >
          <ul className="ps-container flex flex-col py-2">
            {polisurNavItems.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="block border-b border-[var(--ps-line)] px-1 py-3.5 text-sm font-medium text-[var(--ps-paper)] last:border-b-0"
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
