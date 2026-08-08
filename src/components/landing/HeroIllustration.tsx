import { heroFlowSteps } from "@/constants/landing";
import { cn } from "@/lib/utils";

type HeroIllustrationProps = {
  className?: string;
};

function HeroIllustration({ className }: HeroIllustrationProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-lg overflow-hidden lg:max-w-none",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute -left-8 top-8 size-36 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-6 bottom-10 size-40 rounded-full bg-secondary/25 blur-3xl" />
      <div className="absolute inset-0 rounded-[var(--radius-xl)] bg-[radial-gradient(circle_at_30%_20%,rgb(37_99_255/0.16),transparent_55%),radial-gradient(circle_at_80%_70%,rgb(30_58_138/0.14),transparent_50%)]" />
      <div className="absolute inset-3 rounded-[calc(var(--radius-xl)-2px)] border border-border/70 bg-surface/75 shadow-xl backdrop-blur-md" />
      <div className="absolute inset-3 opacity-40 [background-image:linear-gradient(to_right,rgb(37_99_255/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(37_99_255/0.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(circle_at_center,black,transparent_85%)]" />

      <div className="relative grid gap-3 p-5 sm:p-7">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="rounded-[var(--radius-sm)] border border-primary/20 bg-primary/5 px-2.5 py-1 text-caption text-foreground">
            Sistema inteligente
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-40 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span className="text-caption text-muted-foreground">En flujo</span>
          </div>
        </div>

        <div className="grid gap-0">
          {heroFlowSteps.map((step, index) => {
            const isLast = index === heroFlowSteps.length - 1;
            const isMid = index === 2;

            return (
              <div key={step.id} className="relative">
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] border bg-background/90 px-3 py-3 shadow-sm transition-colors",
                    isLast
                      ? "border-primary/40 shadow-[var(--shadow-primary-glow)]"
                      : isMid
                        ? "border-secondary/35"
                        : "border-border",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-caption font-semibold",
                      isLast
                        ? "bg-primary text-primary-foreground"
                        : isMid
                          ? "bg-secondary text-secondary-foreground"
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
                  <div className="hidden items-center gap-1 sm:flex">
                    <span className="size-1.5 rounded-full bg-primary/70" />
                    <span className="h-px w-6 bg-border" />
                    <span className="size-1.5 rounded-full bg-border" />
                  </div>
                </div>

                {!isLast ? (
                  <div className="mx-7 flex h-3 items-center">
                    <div className="h-full w-px bg-gradient-to-b from-primary/50 to-border" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          {["Entrada", "Proceso", "Salida"].map((label) => (
            <div
              key={label}
              className="rounded-[var(--radius-md)] border border-border/80 bg-background/80 px-3 py-2"
            >
              <p className="text-caption text-muted-foreground">{label}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-muted">
                <div className="h-full w-2/3 rounded-full bg-primary/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { HeroIllustration };
export type { HeroIllustrationProps };
