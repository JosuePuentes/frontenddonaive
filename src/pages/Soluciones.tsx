import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PublicPage, SectionTitle } from "@/components/page";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { servicesContent } from "@/content/services";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Soluciones = () => {
  const seo = getSeo(ROUTES.soluciones);

  return (
    <PublicPage
      seo={seo}
      eyebrow={servicesContent.eyebrow}
      title={servicesContent.title}
      description={servicesContent.description}
    >
      <SectionTitle
        title="Categorías de solución"
        description="Capacidades organizadas por el tipo de problema que ayudan a resolver."
      />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {servicesContent.categories?.map((category, index) => (
          <MotionReveal key={category.id} delay={index * 0.04}>
            <Card variant="elevated" className="h-full">
              <h2 className="text-h3">{category.title}</h2>
              <p className="mt-3 text-body-small text-muted-foreground">
                {category.description}
              </p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-body-small text-foreground"
                  >
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </MotionReveal>
        ))}
      </div>

      <MotionReveal className="mt-12 flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-surface-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-2xl">
          <p className="text-body text-foreground">
            Si todavía no sabes qué solución necesitas, empieza por el problema.
          </p>
          <p className="mt-2 text-body-small text-muted-foreground">
            {servicesContent.notes?.[0]}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to={ROUTES.contacto}>Cuéntanos tu problema</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTES.academy}>Ver Academy</Link>
          </Button>
        </div>
      </MotionReveal>
    </PublicPage>
  );
};

export default Soluciones;
