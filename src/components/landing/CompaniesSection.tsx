import {
  Briefcase,
  Building2,
  Code2,
  Landmark,
  Rocket,
  Store,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { companiesContent } from "@/constants/landing";

const iconMap: Record<
  (typeof companiesContent.categories)[number]["icon"],
  LucideIcon
> = {
  building: Building2,
  rocket: Rocket,
  store: Store,
  briefcase: Briefcase,
  landmark: Landmark,
  code: Code2,
};

function CompaniesSection() {
  return (
    <Section background="muted" spacing="lg" className="overflow-x-clip">
      <div className="mx-auto max-w-3xl text-center">
        <MotionReveal>
          <Heading variant="h2" className="text-balance">
            {companiesContent.title}
          </Heading>
          <p className="mt-5 text-pretty text-body text-muted-foreground">
            {companiesContent.description}
          </p>
        </MotionReveal>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companiesContent.categories.map((category, index) => {
          const Icon = iconMap[category.icon];

          return (
            <MotionReveal key={category.id} delay={index * 0.04}>
              <Card
                variant="default"
                className="group h-full border-border/80 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary transition-transform duration-[var(--duration-fast)] group-hover:scale-105">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold text-foreground">
                    {category.label}
                  </h3>
                </div>
              </Card>
            </MotionReveal>
          );
        })}
      </div>
    </Section>
  );
}

export { CompaniesSection };
