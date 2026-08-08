import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState, PublicPage, SectionTitle } from "@/components/page";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { mediaContent } from "@/content/media";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Media = () => {
  const seo = getSeo(ROUTES.media);
  const categories = mediaContent.categories?.[0];

  return (
    <PublicPage
      seo={seo}
      eyebrow={mediaContent.eyebrow}
      title={mediaContent.title}
      description={mediaContent.description}
    >
      {categories ? (
        <div>
          <SectionTitle
            title={categories.title}
            description={categories.description}
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.items.map((item) => (
              <Badge key={item} variant="muted">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-12">
        <SectionTitle
          title="Espacios de contenido"
          description="Placeholders de categorías. No representan artículos publicados."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {mediaContent.blocks?.map((block, index) => (
            <MotionReveal key={block.id} delay={index * 0.04}>
              <Card
                variant="outline"
                className="h-full border-dashed bg-surface-muted/30"
              >
                <div className="mb-3">
                  <Badge variant="outline">Placeholder</Badge>
                </div>
                <h2 className="text-h3">{block.title}</h2>
                <p className="mt-3 text-body-small text-muted-foreground">
                  {block.description}
                </p>
              </Card>
            </MotionReveal>
          ))}
        </div>
      </div>

      <EmptyState
        className="mt-12"
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
