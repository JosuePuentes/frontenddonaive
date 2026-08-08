import { Link, useLocation } from "react-router";
import { Menu, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Breadcrumbs } from "@/components/dashboard/navigation/Breadcrumbs";
import {
  DASHBOARD_ROUTES,
  crmNavGroup,
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

  if (pathname.startsWith("/dashboard/crm/leads/") && pathname !== DASHBOARD_ROUTES.crmLeads) {
    return {
      title: "Detalle de lead",
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "CRM", to: DASHBOARD_ROUTES.crm },
        { label: "Leads", to: DASHBOARD_ROUTES.crmLeads },
        { label: "Detalle" },
      ],
    };
  }

  if (pathname === DASHBOARD_ROUTES.crmDiagnosticoNuevo) {
    return {
      title: "Nuevo diagnóstico",
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "CRM", to: DASHBOARD_ROUTES.crm },
        { label: "Diagnósticos", to: DASHBOARD_ROUTES.crmDiagnosticos },
        { label: "Nuevo" },
      ],
    };
  }

  if (
    pathname.startsWith("/dashboard/crm/diagnosticos/") &&
    pathname !== DASHBOARD_ROUTES.crmDiagnosticos &&
    pathname !== DASHBOARD_ROUTES.crmDiagnosticoNuevo
  ) {
    return {
      title: "Detalle de diagnóstico",
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "CRM", to: DASHBOARD_ROUTES.crm },
        { label: "Diagnósticos", to: DASHBOARD_ROUTES.crmDiagnosticos },
        { label: "Detalle" },
      ],
    };
  }

  if (pathname === DASHBOARD_ROUTES.crmPropuestaNueva) {
    return {
      title: "Nueva propuesta",
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "CRM", to: DASHBOARD_ROUTES.crm },
        { label: "Propuestas", to: DASHBOARD_ROUTES.crmPropuestas },
        { label: "Nueva" },
      ],
    };
  }

  if (
    pathname.startsWith("/dashboard/crm/propuestas/") &&
    pathname !== DASHBOARD_ROUTES.crmPropuestas &&
    pathname !== DASHBOARD_ROUTES.crmPropuestaNueva
  ) {
    return {
      title: "Detalle de propuesta",
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "CRM", to: DASHBOARD_ROUTES.crm },
        { label: "Propuestas", to: DASHBOARD_ROUTES.crmPropuestas },
        { label: "Detalle" },
      ],
    };
  }

  if (pathname === DASHBOARD_ROUTES.servicioNuevo) {
    return {
      title: "Nuevo servicio",
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "Servicios", to: DASHBOARD_ROUTES.servicios },
        { label: "Nuevo" },
      ],
    };
  }

  if (
    pathname.startsWith("/dashboard/servicios/") &&
    pathname !== DASHBOARD_ROUTES.servicios &&
    pathname !== DASHBOARD_ROUTES.servicioNuevo
  ) {
    return {
      title: "Detalle de servicio",
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "Servicios", to: DASHBOARD_ROUTES.servicios },
        { label: "Detalle" },
      ],
    };
  }

  const crmItem = crmNavGroup.items.find((item) => item.to === pathname);
  if (crmItem) {
    return {
      title: crmItem.label === "Dashboard" ? "CRM" : crmItem.label,
      breadcrumbs: [
        { label: "Dashboard", to: DASHBOARD_ROUTES.root },
        { label: "CRM", to: DASHBOARD_ROUTES.crm },
        ...(crmItem.to === DASHBOARD_ROUTES.crm
          ? []
          : [{ label: crmItem.label }]),
      ],
    };
  }

  const current = dashboardNavItems.find((item) => item.to === pathname);

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
