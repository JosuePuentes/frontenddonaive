import { useEffect, useId, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ctaNavItem, primaryNavItems } from "@/constants/navigation";
import { useScrollElevation } from "@/hooks/useScrollElevation";
import { cn } from "@/lib/utils";

type NavbarProps = {
  className?: string;
};

function Navbar({ className }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isElevated = useScrollElevation({ threshold: 8 });
  const location = useLocation();
  const mobileMenuId = useId();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      isActive && "text-foreground",
    );

  return (
    <header
      data-slot="navbar"
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-[var(--duration-normal)] ease-[var(--ease-standard)]",
        isElevated || isMobileMenuOpen
          ? "border-border/80 bg-background/80 shadow-sm backdrop-blur-md"
          : "border-transparent bg-transparent backdrop-blur-0",
        className,
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo showWordmark />

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-1 lg:flex"
        >
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClassName}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link to={ctaNavItem.to}>{ctaNavItem.label}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? (
              <X aria-hidden="true" />
            ) : (
              <Menu aria-hidden="true" />
            )}
          </Button>
        </div>
      </Container>

      <div
        id={mobileMenuId}
        hidden={!isMobileMenuOpen}
        className="border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      >
        <Container className="flex flex-col gap-2 py-4">
          <nav aria-label="Navegación móvil" className="flex flex-col gap-1">
            {primaryNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={linkClassName}
                end={item.to === "/"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Button asChild className="mt-2 w-full">
            <Link
              to={ctaNavItem.to}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {ctaNavItem.label}
            </Link>
          </Button>
        </Container>
      </div>
    </header>
  );
}

export { Navbar };
export type { NavbarProps };
