import { heroFlowSteps } from "@/constants/landing";
import { cn } from "@/lib/utils";

type HeroIllustrationProps = {
  className?: string;
};

function HeroIllustration({ className }: HeroIllustrationProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-lg lg:max-w-none",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-[var(--radius-xl)] bg-[radial-gradient(circle_at_30%_20%,rgb(37_99_255/0.18),transparent_55%),radial-gradient(circle_at_80%_70%,rgb(30_58_138/0.16),transparent_50%)]" />
      <div className="absolute inset-4 rounded-[var(--radius-xl)] border border-border/70 bg-surface/70 shadow-lg backdrop-blur-sm" />

      <div className="relative grid gap-3 p-5 sm:p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="rounded-[var(--radius-sm)] border border-border bg-background/80 px-2.5 py-1 text-caption text-muted-foreground">
            Flujo del sistema
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-success" />
            <span className="text-caption text-muted-foreground">Activo</span>
          </div>
        </div>

        <div className="grid gap-2">
          {heroFlowSteps.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-background/90 px-3 py-3 shadow-sm">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-caption font-semibold",
                    index === heroFlowSteps.length - 1
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-primary-glow)]"
                      : "bg-surface-muted text-foreground",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {step.label}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
                <div className="hidden h-2 w-12 overflow-hidden rounded-full bg-surface-muted sm:block">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{ width: `${56 + index * 8}%` }}
                  />
                </div>
              </div>

              {index < heroFlowSteps.length - 1 ? (
                <div className="mx-7 h-2 w-px bg-border" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { label: "Señales", value: "12" },
            { label: "Procesos", value: "08" },
            { label: "Control", value: "OK" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-[var(--radius-md)] border border-border bg-background/80 px-3 py-2"
            >
              <p className="text-caption text-muted-foreground">{metric.label}</p>
              <p className="text-sm font-semibold text-foreground">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { HeroIllustration };
export type { HeroIllustrationProps };
