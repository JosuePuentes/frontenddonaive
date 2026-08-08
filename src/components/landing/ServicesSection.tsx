import { Link } from "react-router";
import {
  BarChart3,
  Bot,
  GraduationCap,
  Layers3,
  Search,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { servicesContent } from "@/constants/landing";

const iconMap: Record<
  (typeof servicesContent.items)[number]["icon"],
  LucideIcon
> = {
  search: Search,
  workflow: Workflow,
  bot: Bot,
  layers: Layers3,
  chart: BarChart3,
  graduation: GraduationCap,
};

function ServicesSection() {
  return (
    <Section background="default" spacing="lg" className="overflow-x-clip">
      <div className="mx-auto max-w-3xl text-center">
        <MotionReveal>
          <Heading variant="h2" className="text-balance">
            {servicesContent.title}
          </Heading>
          <p className="mt-5 text-pretty text-body text-muted-foreground">
            {servicesContent.description}
          </p>
        </MotionReveal>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {servicesContent.items.map((item, index) => {
          const Icon = iconMap[item.icon];

          return (
            <MotionReveal key={item.id} delay={index * 0.04}>
              <Card
                variant="elevated"
                className="group h-full border-border/70 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/5"
              >
                <CardHeader>
                  <span className="mb-3 inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-secondary/10 text-secondary transition-transform duration-[var(--duration-fast)] group-hover:scale-105 dark:bg-primary/10 dark:text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="mt-2 text-pretty">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </MotionReveal>
          );
        })}
      </div>

      <MotionReveal className="mt-12 flex justify-center" delay={0.08}>
        <Button asChild>
          <Link to={servicesContent.cta.to}>{servicesContent.cta.label}</Link>
        </Button>
      </MotionReveal>
    </Section>
  );
}

export { ServicesSection };
