import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { methodologyContent } from "@/constants/landing";
import { cn } from "@/lib/utils";

function MethodologySection() {
  return (
    <Section
      background="muted"
      spacing="lg"
      className="relative overflow-x-clip"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(37_99_255/0.1),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-primary/25 to-transparent xl:block" />

      <div className="relative mx-auto max-w-3xl text-center">
        <MotionReveal>
          <Heading variant="h2" className="text-balance">
            {methodologyContent.title}
          </Heading>
          <p className="mt-5 text-pretty text-body text-muted-foreground">
            {methodologyContent.description}
          </p>
        </MotionReveal>
      </div>

      {/* Desktop / large: horizontal flow */}
      <div className="relative mt-14 hidden xl:block">
        <div className="absolute left-[6%] right-[6%] top-[2.1rem] h-px bg-border" />
        <div className="absolute left-[6%] right-[6%] top-[2.1rem] h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

        <ol className="relative grid grid-cols-6 gap-3">
          {methodologyContent.steps.map((step, index) => (
            <li key={step.id}>
              <MotionReveal delay={index * 0.05}>
                <div className="flex flex-col items-center text-center">
                  <div className="relative z-10 mb-5 flex size-16 items-center justify-center rounded-full border border-primary/30 bg-background shadow-md shadow-primary/10">
                    <span className="text-sm font-semibold tracking-[0.08em] text-primary">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[11rem] text-caption text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </MotionReveal>
            </li>
          ))}
        </ol>
      </div>

      {/* Tablet / mobile: vertical sequence */}
      <ol className="relative mt-12 space-y-0 xl:hidden">
        {methodologyContent.steps.map((step, index) => {
          const isLast = index === methodologyContent.steps.length - 1;

          return (
            <MotionReveal key={step.id} delay={index * 0.04}>
              <li className="relative grid grid-cols-[auto_1fr] gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-full border bg-background text-caption font-semibold tracking-[0.08em] shadow-sm",
                      isLast
                        ? "border-primary/40 text-primary shadow-[var(--shadow-primary-glow)]"
                        : "border-border text-primary",
                    )}
                  >
                    {step.number}
                  </div>
                  {!isLast ? (
                    <div className="my-1 w-px flex-1 bg-gradient-to-b from-primary/40 to-border min-h-8" />
                  ) : null}
                </div>
                <div
                  className={cn(
                    "rounded-[var(--radius-lg)] border border-border/80 bg-background/85 p-5 shadow-sm",
                    !isLast && "mb-4",
                  )}
                >
                  <h3 className="text-h3">{step.title}</h3>
                  <p className="mt-2 text-body-small text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </li>
            </MotionReveal>
          );
        })}
      </ol>
    </Section>
  );
}

export { MethodologySection };
