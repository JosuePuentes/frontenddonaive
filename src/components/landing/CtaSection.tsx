import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { ctaContent } from "@/constants/landing";

function CtaSection() {
  return (
    <Section spacing="default" contained={false} className="px-[var(--page-padding-x)]">
      <MotionReveal className="mx-auto max-w-[var(--container-max)]">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-primary/20 bg-[linear-gradient(135deg,#09090B_0%,#1E3A8A_55%,#2563FF_100%)] px-6 py-14 text-center shadow-xl sm:px-10 sm:py-16">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgb(37_99_255/0.35),transparent_40%)]" />
          <div className="relative mx-auto max-w-2xl">
            <Heading variant="h2" className="text-white">
              {ctaContent.title}
            </Heading>
            <p className="mt-4 text-body text-blue-100">
              {ctaContent.description}
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-[#09090B] hover:bg-white/90 hover:shadow-[var(--shadow-primary-glow)]"
              >
                <Link to={ctaContent.button.to}>{ctaContent.button.label}</Link>
              </Button>
            </div>
          </div>
        </div>
      </MotionReveal>
    </Section>
  );
}

export { CtaSection };
