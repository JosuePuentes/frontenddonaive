import { EmptyState, PublicPage, SectionTitle } from "@/components/page";
import { Card } from "@/components/ui/Card";
import { mediaContent } from "@/content/media";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Media = () => {
  const seo = getSeo(ROUTES.media);

  return (
    <PublicPage
      seo={seo}
      eyebrow={mediaContent.eyebrow}
      title={mediaContent.title}
      description={mediaContent.description}
    >
      <SectionTitle
        title="Contenido futuro"
        description="Espacio preparado para análisis y piezas editoriales."
      />
      <div className="mt-8 grid gap-4">
        {mediaContent.blocks?.map((block) => (
          <Card key={block.id} variant="outline">
            <h2 className="text-h3">{block.title}</h2>
            <p className="mt-3 text-body-small text-muted-foreground">
              {block.description}
            </p>
          </Card>
        ))}
      </div>
      <EmptyState
        className="mt-10"
        title="Sin publicaciones todavía"
        description={
          mediaContent.notes?.join(" ") ??
          "El contenido se incorporará progresivamente."
        }
      />
    </PublicPage>
  );
};

export default Media;
