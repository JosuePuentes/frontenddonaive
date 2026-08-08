import { Card } from "@/components/ui/Card";
import { EmptyState, PublicPage, SectionTitle } from "@/components/page";
import { academyContent } from "@/content/academy";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Academy = () => {
  const seo = getSeo(ROUTES.academy);

  return (
    <PublicPage
      seo={seo}
      eyebrow={academyContent.eyebrow}
      title={academyContent.title}
      description={academyContent.description}
    >
      <SectionTitle
        title="Concepto"
        description="Presentación de la futura Academia Donaive."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {academyContent.blocks?.map((block) => (
          <Card key={block.id} variant="default" className="h-full">
            <h2 className="text-h3">{block.title}</h2>
            <p className="mt-3 text-body-small text-muted-foreground">
              {block.description}
            </p>
          </Card>
        ))}
      </div>
      <EmptyState
        className="mt-10"
        title="Plataforma en preparación"
        description="Donaive Academy todavía no opera como una plataforma educativa completa. Esta página define su dirección."
      />
    </PublicPage>
  );
};

export default Academy;
