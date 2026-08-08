import { Card } from "@/components/ui/Card";
import { PublicPage, SectionTitle } from "@/components/page";
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
        title="Problemas que resolvemos"
        description="Una organización por capacidades orientada a contextos reales."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servicesContent.blocks?.map((block) => (
          <Card key={block.id} variant="elevated" className="h-full">
            <h2 className="text-h3">{block.title}</h2>
            <p className="mt-3 text-body-small text-muted-foreground">
              {block.description}
            </p>
          </Card>
        ))}
      </div>
    </PublicPage>
  );
};

export default Soluciones;
