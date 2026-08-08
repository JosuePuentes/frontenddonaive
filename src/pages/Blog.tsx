import { EmptyState, PublicPage, SectionTitle } from "@/components/page";
import { Card } from "@/components/ui/Card";
import { blogContent } from "@/content/blog";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Blog = () => {
  const seo = getSeo(ROUTES.blog);

  return (
    <PublicPage
      seo={seo}
      eyebrow={blogContent.eyebrow}
      title={blogContent.title}
      description={blogContent.description}
    >
      <SectionTitle
        title="Estructura editorial"
        description="Lista de publicaciones preparada para conectarse a CMS o API."
      />
      <div className="mt-8 grid gap-4">
        {blogContent.blocks?.map((block) => (
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
        title="Blog en preparación"
        description={
          blogContent.notes?.join(" ") ??
          "Todavía no hay artículos publicados."
        }
      />
    </PublicPage>
  );
};

export default Blog;
