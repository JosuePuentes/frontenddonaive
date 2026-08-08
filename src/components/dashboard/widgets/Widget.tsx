import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type WidgetProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
};

function Widget({ title, description, children, className }: WidgetProps) {
  return (
    <Card variant="default" className={cn("h-full", className)}>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-body-small text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}

export { Widget };
export type { WidgetProps };
