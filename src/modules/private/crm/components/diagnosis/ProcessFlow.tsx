import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/page/EmptyState";
import { cn } from "@/lib/utils";
import type {
  CurrentProcessStep,
  ProposedProcessStep,
} from "@/types/diagnosis";

type ProcessFlowVariant = "current" | "proposed";

type ProcessFlowProps = {
  variant: ProcessFlowVariant;
  steps: CurrentProcessStep[] | ProposedProcessStep[];
  title?: string;
  className?: string;
};

function isCurrentVariant(
  variant: ProcessFlowVariant,
): variant is "current" {
  return variant === "current";
}

function ProcessFlow({
  variant,
  steps,
  title,
  className,
}: ProcessFlowProps) {
  const sorted = [...steps].sort((a, b) => a.step - b.step);
  const heading =
    title ?? (variant === "current" ? "Proceso actual (AS-IS)" : "Proceso propuesto (TO-BE)");

  if (sorted.length === 0) {
    return (
      <EmptyState
        title={`Sin pasos — ${heading}`}
        description="El flujo se mostrará cuando existan pasos registrados."
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{heading}</h3>
        <Badge variant="outline">
          {variant === "current" ? "AS-IS" : "TO-BE"}
        </Badge>
      </div>

      <ol
        className={cn(
          "flex flex-col gap-3",
          "md:flex-row md:items-stretch md:gap-2 md:overflow-x-auto md:pb-2",
        )}
      >
        {sorted.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              "relative flex min-w-0 flex-1 flex-col",
              "md:min-w-[220px] md:max-w-[280px]",
            )}
          >
            <Card variant="outline" className="flex h-full flex-col gap-2 p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-caption font-semibold text-primary">
                  {item.step}
                </span>
                <p className="text-sm font-medium text-foreground">
                  {item.action}
                </p>
              </div>
              <dl className="space-y-1 text-caption text-muted-foreground">
                {item.responsible ? (
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Responsable:{" "}
                    </dt>
                    <dd className="inline">{item.responsible}</dd>
                  </div>
                ) : null}
                {item.input ? (
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Entrada:{" "}
                    </dt>
                    <dd className="inline">{item.input}</dd>
                  </div>
                ) : null}
                {item.output ? (
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Salida:{" "}
                    </dt>
                    <dd className="inline">{item.output}</dd>
                  </div>
                ) : null}
                {item.system ? (
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Sistema:{" "}
                    </dt>
                    <dd className="inline">{item.system}</dd>
                  </div>
                ) : null}
                {isCurrentVariant(variant) &&
                "problem" in item &&
                item.problem ? (
                  <div>
                    <dt className="inline font-medium text-destructive">
                      Problema:{" "}
                    </dt>
                    <dd className="inline">{item.problem}</dd>
                  </div>
                ) : null}
                {!isCurrentVariant(variant) &&
                "automation" in item &&
                item.automation ? (
                  <div>
                    <dt className="inline font-medium text-foreground">
                      Automatización:{" "}
                    </dt>
                    <dd className="inline">{item.automation}</dd>
                  </div>
                ) : null}
              </dl>
            </Card>

            {index < sorted.length - 1 ? (
              <>
                <span
                  className="flex justify-center py-1 text-muted-foreground md:hidden"
                  aria-hidden="true"
                >
                  ↓
                </span>
                <span
                  className="absolute top-1/2 -right-2 hidden -translate-y-1/2 text-muted-foreground md:block"
                  aria-hidden="true"
                >
                  →
                </span>
              </>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { ProcessFlow };
export type { ProcessFlowProps, ProcessFlowVariant };
