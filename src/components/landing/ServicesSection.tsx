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
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { servicesContent } from "@/constants/landing";

const iconMap: Record<(typeof servicesContent.items)[number]["icon"], LucideIcon> = {
  search: Search,
  workflow: Workflow,
  bot: Bot,
  layers: Layers3,
  chart: BarChart3,
  graduation: GraduationCap,
};

function ServicesSection() {
  return (
    <Section background="default" spacing="default">
      <div className="mx-auto max-w-3xl text-center">
        <MotionReveal>
          <Heading variant="h2">{servicesContent.title}</Heading>
          <p className="mt-4 text-body text-muted-foreground">
            {servicesContent.description}
          </p>
        </MotionReveal>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servicesContent.items.map((item, index) => {
          const Icon = iconMap[item.icon];

          return (
            <MotionReveal key={item.id} delay={index * 0.05}>
              <Card
                variant="elevated"
                className="h-full transition-transform duration-[var(--duration-fast)] hover:-translate-y-0.5"
              >
                <CardHeader>
                  <span className="mb-3 inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-secondary/10 text-secondary dark:text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </MotionReveal>
          );
        })}
      </div>

      <MotionReveal className="mt-10 flex justify-center" delay={0.1}>
        <Button asChild>
          <Link to={servicesContent.cta.to}>{servicesContent.cta.label}</Link>
        </Button>
      </MotionReveal>
    </Section>
  );
}

export { ServicesSection };
