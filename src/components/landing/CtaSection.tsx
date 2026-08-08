import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { ctaContent } from "@/constants/landing";

function CtaSection() {
  return (
    <Section
      spacing="lg"
      contained={false}
      className="overflow-x-clip px-[var(--page-padding-x)]"
    >
      <MotionReveal className="mx-auto max-w-[var(--container-max)]">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-primary/25 bg-[var(--donaive-black)] px-6 py-16 text-center shadow-xl sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(37_99_255/0.28),transparent_40%),radial-gradient(circle_at_80%_75%,rgb(30_58_138/0.45),transparent_45%),linear-gradient(160deg,var(--donaive-black),#0b1224_55%,#102a6b)]" />
          <div className="pointer-events-none absolute -left-10 top-10 size-40 rounded-full bg-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -right-8 bottom-6 size-48 rounded-full bg-secondary/40 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgb(255_255_255/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.08)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]" />

          <div className="relative mx-auto max-w-2xl">
            <Heading variant="h2" className="text-balance text-[var(--donaive-white)]">
              {ctaContent.title}
            </Heading>
            <p className="mt-5 text-pretty text-body text-[var(--donaive-white)]/75">
              {ctaContent.description}
            </p>
            <div className="mt-9 flex justify-center">
              <Button
                asChild
                size="lg"
                className="bg-[var(--donaive-white)] text-[var(--donaive-black)] shadow-[var(--shadow-primary-glow)] hover:bg-[var(--donaive-white)]/95"
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
