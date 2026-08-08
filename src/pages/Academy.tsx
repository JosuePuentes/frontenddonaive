import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PublicPage, SectionTitle } from "@/components/page";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { academyContent } from "@/content/academy";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Academy = () => {
  const seo = getSeo(ROUTES.academy);
  const areas = academyContent.categories?.[0];

  return (
    <PublicPage
      seo={seo}
      eyebrow={academyContent.eyebrow}
      title={academyContent.title}
      description={academyContent.description}
    >
      <MotionReveal className="rounded-[var(--radius-xl)] border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <p className="max-w-3xl text-body text-foreground">
          {academyContent.notes?.[0]}
        </p>
      </MotionReveal>

      <div className="mt-12">
        <SectionTitle
          title="Visión de Donaive Academy"
          description="Una línea de negocio orientada a capacidades, no a un catálogo prematuro."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {academyContent.blocks?.map((block, index) => (
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

      {areas ? (
        <div className="mt-16">
          <SectionTitle
            title={areas.title}
            description={areas.description}
          />
          <div className="mt-8 flex flex-wrap gap-2">
            {areas.items.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <EmptyState
        className="mt-12"
        title="Formaciones en preparación"
        description={
          academyContent.notes?.slice(1).join(" ") ??
          "No hay cursos activos todavía."
        }
      />

      <MotionReveal className="mt-10">
        <Button asChild>
          <Link to={ROUTES.contacto}>Hablar con Donaive</Link>
        </Button>
      </MotionReveal>
    </PublicPage>
  );
};

export default Academy;
