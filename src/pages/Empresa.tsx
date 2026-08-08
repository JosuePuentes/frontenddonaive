import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { PublicPage, SectionTitle } from "@/components/page";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { companyContent } from "@/content/company";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Empresa = () => {
  const seo = getSeo(ROUTES.empresa);

  return (
    <PublicPage
      seo={seo}
      eyebrow={companyContent.eyebrow}
      title={companyContent.title}
      description={companyContent.description}
    >
      <MotionReveal>
        <div className="flex flex-wrap gap-2">
          {companyContent.pillars?.map((pillar) => (
            <Badge key={pillar.id} variant="outline">
              {pillar.label}
            </Badge>
          ))}
        </div>
        <p className="mt-4 max-w-3xl text-body text-muted-foreground">
          {companyContent.notes?.[0]}
        </p>
      </MotionReveal>

      <div className="mt-12">
        <SectionTitle
          title="Filosofía y capacidad"
          description="Una forma de pensar centrada en el problema, no en la herramienta."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companyContent.blocks?.map((block, index) => (
            <MotionReveal key={block.id} delay={index * 0.04}>
              <Card variant="default" className="h-full">
                <h2 className="text-h3">{block.title}</h2>
                <p className="mt-3 text-body-small text-muted-foreground">
                  {block.description}
                </p>
              </Card>
            </MotionReveal>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <SectionTitle
          title="Metodología"
          description="Uno de los elementos centrales de la marca Donaive."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {companyContent.steps?.map((step, index) => (
            <MotionReveal key={step.id} delay={index * 0.04}>
              <Card variant="elevated" className="h-full">
                <p className="text-caption font-semibold tracking-[0.14em] text-primary">
                  {step.number}
                </p>
                <Heading variant="h3" className="mt-3">
                  {step.title}
                </Heading>
                <p className="mt-2 text-body-small text-muted-foreground">
                  {step.description}
                </p>
              </Card>
            </MotionReveal>
          ))}
        </div>
      </div>

      <MotionReveal className="mt-12 rounded-[var(--radius-xl)] border border-border bg-surface-muted/50 p-6 sm:p-8">
        <p className="max-w-3xl text-body text-foreground">
          {companyContent.notes?.[1]}
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to={ROUTES.contacto}>Cuéntanos tu problema</Link>
          </Button>
        </div>
      </MotionReveal>
    </PublicPage>
  );
};

export default Empresa;
