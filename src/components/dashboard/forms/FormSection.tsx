import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <Card variant="default" className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-body-small text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4">{children}</div>
    </Card>
  );
}

export { FormSection };
export type { FormSectionProps };
