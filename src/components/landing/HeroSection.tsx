import { Link } from "react-router";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { HeroIllustration } from "@/components/landing/HeroIllustration";
import { heroContent } from "@/constants/landing";

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgb(37_99_255/0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgb(30_58_138/0.1),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgb(113_113_122/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(113_113_122/0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

      <Container className="relative grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-20">
        <div className="flex flex-col items-start gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
          >
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-foreground">
              {heroContent.badge}
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col gap-4"
          >
            <Heading variant="display" className="max-w-3xl">
              {heroContent.title}
            </Heading>
            <p className="max-w-2xl text-body text-muted-foreground">
              {heroContent.subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.2, 0, 0, 1] }}
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
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.2, 0, 0, 1] }}
        >
          <HeroIllustration />
        </motion.div>
      </Container>
    </section>
  );
}

export { HeroSection };
