import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { methodologyContent } from "@/constants/landing";

function MethodologySection() {
  return (
    <Section
      background="muted"
      spacing="default"
      className="relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgb(37_99_255/0.08),transparent_55%)]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <MotionReveal>
          <Heading variant="h2">{methodologyContent.title}</Heading>
          <p className="mt-4 text-body text-muted-foreground">
            {methodologyContent.description}
          </p>
        </MotionReveal>
      </div>

      <div className="relative mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {methodologyContent.steps.map((step, index) => (
          <MotionReveal key={step.id} delay={index * 0.05}>
            <Card
              variant="default"
              className="h-full border-border/80 bg-background/80 transition-shadow duration-[var(--duration-fast)] hover:shadow-md"
            >
              <p className="text-caption font-semibold tracking-[0.14em] text-primary">
                {step.number}
              </p>
              <h3 className="mt-3 text-h3">{step.title}</h3>
              <p className="mt-2 text-body-small text-muted-foreground">
                {step.description}
              </p>
            </Card>
          </MotionReveal>
        ))}
      </div>
    </Section>
  );
}

export { MethodologySection };
