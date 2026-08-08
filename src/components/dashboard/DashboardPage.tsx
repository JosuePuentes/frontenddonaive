import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardPageProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

function DashboardPage({
  title,
  description,
  actions,
  children,
  className,
}: DashboardPageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-h2">{title}</h1>
          {description ? (
            <p className="mt-2 text-body text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export { DashboardPage };
export type { DashboardPageProps };
