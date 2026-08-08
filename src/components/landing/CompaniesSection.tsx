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

const iconMap: Record<(typeof companiesContent.categories)[number]["icon"], LucideIcon> = {
  building: Building2,
  rocket: Rocket,
  store: Store,
  briefcase: Briefcase,
  landmark: Landmark,
  code: Code2,
};

function CompaniesSection() {
  return (
    <Section background="muted" spacing="default">
      <div className="mx-auto max-w-3xl text-center">
        <MotionReveal>
          <Heading variant="h2">{companiesContent.title}</Heading>
          <p className="mt-4 text-body text-muted-foreground">
            {companiesContent.description}
          </p>
        </MotionReveal>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companiesContent.categories.map((category, index) => {
          const Icon = iconMap[category.icon];

          return (
            <MotionReveal key={category.id} delay={index * 0.05}>
              <Card
                variant="default"
                className="h-full transition-transform duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary">
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
