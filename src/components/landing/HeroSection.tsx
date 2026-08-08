import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import { heroContent } from "@/constants/landing";

function HeroSection() {
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = (delay = 0) =>
    prefersReducedMotion
      ? undefined
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.45,
            delay,
            ease: [0.2, 0, 0, 1] as const,
          },
        };

  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgb(37_99_255/0.14),transparent_42%),radial-gradient(circle_at_88%_12%,rgb(30_58_138/0.12),transparent_38%),radial-gradient(circle_at_70%_85%,rgb(37_99_255/0.08),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.28] [background-image:linear-gradient(to_right,rgb(113_113_122/0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgb(113_113_122/0.09)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_80%)]" />
      <div className="pointer-events-none absolute -left-16 top-24 size-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 size-64 rounded-full bg-secondary/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <Container className="relative grid min-h-[calc(100svh-4rem)] items-center gap-12 overflow-x-clip py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-20">
        <div className="flex max-w-3xl flex-col items-start gap-7">
          <motion.div {...fadeUp(0)}>
            <Badge
              variant="outline"
              className="border-primary/30 bg-primary/5 text-foreground"
            >
              {heroContent.badge}
            </Badge>
          </motion.div>

          <motion.div {...fadeUp(0.06)} className="flex flex-col gap-5">
            <Heading variant="display" className="text-balance">
              {heroContent.title}
            </Heading>
            <p className="max-w-2xl text-pretty text-body text-muted-foreground">
              {heroContent.subtitle}
            </p>
          </motion.div>

          <motion.div
            {...fadeUp(0.12)}
            className="flex w-full flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={heroContent.primaryCta.to}>
                {heroContent.primaryCta.label}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link to={heroContent.secondaryCta.to}>
                {heroContent.secondaryCta.label}
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          {...(prefersReducedMotion
            ? undefined
            : {
                initial: { opacity: 0, scale: 0.98, y: 22 },
                animate: { opacity: 1, scale: 1, y: 0 },
                transition: {
                  duration: 0.5,
                  delay: 0.14,
                  ease: [0.2, 0, 0, 1] as const,
                },
              })}
          className="min-w-0"
        >
          <HeroIllustration />
        </motion.div>
      </Container>
    </section>
  );
}

export { HeroSection };
