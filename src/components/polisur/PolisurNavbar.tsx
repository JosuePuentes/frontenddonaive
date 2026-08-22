import { Link, NavLink } from "react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { PolisurCrest } from "@/components/polisur/PolisurCrest";
import { PolisurInstitutionalMarks } from "@/components/polisur/PolisurInstitutionalMarks";
import { PolisurMark } from "@/components/polisur/PolisurMark";
import { usePolisurTheme } from "@/components/polisur/usePolisurTheme";
import {
  POLISUR_ROUTES,
  polisurNavItems,
} from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";

function PolisurNavbar() {
  const [open, setOpen] = useState(false);
  const { isCanina } = usePolisurTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ps-line)] bg-[var(--ps-navy-800)] backdrop-blur-md">
      <div className="ps-container flex h-[3.75rem] items-center justify-between sm:h-[4.25rem]">
        <Link
          to={isCanina ? POLISUR_ROUTES.unidadCanina : POLISUR_ROUTES.home}
          className="flex min-w-0 items-center gap-3"
          onClick={() => setOpen(false)}
        >
          {isCanina ? (
            <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center">
              <PolisurMark
                src={POLISUR_MEDIA.k9}
                alt="Unidad de Patrullaje Canino"
                className="h-full w-full"
              />
            </span>
          ) : (
            <PolisurCrest size="md" />
          )}
          <span className="min-w-0 leading-tight">
            <span className="ps-display block truncate text-[1.1rem] text-[var(--ps-white)] sm:text-xl">
              {isCanina ? "Unidad Canina" : polisurCopy.brand.name}
            </span>
            <span className="block truncate text-[0.62rem] uppercase tracking-[0.14em] text-[var(--ps-steel-400)] sm:text-[0.65rem]">
              {isCanina ? polisurCopy.brand.name : polisurCopy.brand.line}
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

        <div className="flex items-center gap-2 xl:hidden">
          <Link
            to={POLISUR_ROUTES.noticias}
            className="px-2.5 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[var(--ps-paper)]"
            onClick={() => setOpen(false)}
          >
            Noticias
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[1px] border border-[var(--ps-line)] text-[var(--ps-paper)]"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {!isCanina ? (
        <div className="ps-banner-marks border-t border-[var(--ps-line)]">
          <div className="ps-container flex h-12 items-center sm:h-14">
            <PolisurInstitutionalMarks size="sm" />
          </div>
        </div>
      ) : null}

      {open ? (
        <nav
          className="border-t border-[var(--ps-line)] bg-[var(--ps-navy-800)] xl:hidden"
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
