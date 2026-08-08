import { NavLink } from "react-router";
import {
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  FolderKanban,
  FolderOpen,
  GraduationCap,
  Handshake,
  Image,
  KanbanSquare,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  Target,
  Trophy,
  Users,
  type LucideIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/common/Logo";
import {
  DASHBOARD_ROUTES,
  crmNavGroup,
  dashboardNavItems,
  type DashboardNavIcon,
} from "@/constants/dashboard-routes";
import { cn } from "@/lib/utils";

const iconMap: Record<DashboardNavIcon, LucideIcon> = {
  layout: LayoutDashboard,
  users: Users,
  shield: Shield,
  blog: FileText,
  academy: GraduationCap,
  media: Image,
  products: Package,
  services: BriefcaseBusiness,
  cases: Trophy,
  files: FolderOpen,
  settings: Settings,
  crm: Handshake,
  leads: Target,
  pipeline: KanbanSquare,
  diagnosis: ClipboardList,
  proposals: FileText,
  projects: FolderKanban,
};

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-[var(--donaive-black)]/40 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform duration-[var(--duration-normal)] ease-[var(--ease-standard)] lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Logo to={DASHBOARD_ROUTES.root} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Cerrar menú"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </Button>
        </div>

        <nav
          aria-label="Navegación del dashboard"
          className="flex-1 space-y-4 overflow-y-auto p-3"
        >
          <div className="space-y-1">
            {dashboardNavItems.map((item) => {
              const Icon = iconMap[item.icon];

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                      isActive && "bg-primary/10 text-foreground",
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div>
            <p className="mb-2 px-3 text-caption font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {crmNavGroup.label}
            </p>
            <div className="space-y-1">
              {crmNavGroup.items.map((item) => {
                const Icon = iconMap[item.icon];

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                        isActive && "bg-primary/10 text-foreground",
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="border-t border-border p-4">
          <p className="text-caption text-muted-foreground">
            Área administrativa · scaffolding
          </p>
        </div>
      </aside>
    </>
  );
}

export { Sidebar };
export type { SidebarProps };
