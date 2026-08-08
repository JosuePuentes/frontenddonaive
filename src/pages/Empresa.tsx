import { Card } from "@/components/ui/Card";
import { PublicPage, SectionTitle } from "@/components/page";
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
      <SectionTitle
        title="Identidad"
        description="Contenido estructural preparado para ampliarse en iteraciones posteriores."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {companyContent.blocks?.map((block) => (
          <Card key={block.id} variant="default" className="h-full">
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

export default Empresa;
