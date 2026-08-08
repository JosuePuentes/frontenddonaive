import { Link, useLocation } from "react-router";
import { Menu, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Breadcrumbs } from "@/components/dashboard/navigation/Breadcrumbs";
import {
  DASHBOARD_ROUTES,
  dashboardNavItems,
} from "@/constants/dashboard-routes";
import type { BreadcrumbItem } from "@/types/dashboard";
import { cn } from "@/lib/utils";

type TopbarProps = {
  onMenuClick: () => void;
  className?: string;
};

function resolvePageMeta(pathname: string): {
  title: string;
  breadcrumbs: BreadcrumbItem[];
} {
  const current = dashboardNavItems.find((item) => item.to === pathname);
  const profileActive = pathname === DASHBOARD_ROUTES.perfil;

  if (profileActive) {
    return {
      title: "Perfil",
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "Perfil" },
      ],
    };
  }

  if (!current || current.to === DASHBOARD_ROUTES.root) {
    return {
      title: "Dashboard",
      breadcrumbs: [{ label: "Dashboard" }],
    };
  }

  return {
    title: current.label,
    breadcrumbs: [
      { label: "Dashboard", to: DASHBOARD_ROUTES.root },
      { label: current.label },
    ],
  };
}

function Topbar({ onMenuClick, className }: TopbarProps) {
  const { pathname } = useLocation();
  const { title, breadcrumbs } = resolvePageMeta(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur-md",
        className,
      )}
    >
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <Menu aria-hidden="true" />
        </Button>

        <div className="min-w-0 flex-1">
          <Breadcrumbs items={breadcrumbs} />
          <p className="truncate text-sm font-semibold text-foreground sm:text-base">
            {title}
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={DASHBOARD_ROUTES.perfil}>
              <UserRound className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
          </Button>
          <div className="hidden items-center gap-2 rounded-[var(--radius-md)] border border-border px-2.5 py-1.5 md:flex">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-3.5" aria-hidden="true" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-medium text-foreground">Administrador</p>
              <p className="text-[11px] text-muted-foreground">Menú visual</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Topbar };
export type { TopbarProps };
