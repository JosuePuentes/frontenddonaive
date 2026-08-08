import { Badge } from "@/components/ui/Badge";
import { EmptyState, PublicPage, SectionTitle } from "@/components/page";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { blogContent } from "@/content/blog";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Blog = () => {
  const seo = getSeo(ROUTES.blog);
  const categories = blogContent.categories?.[0];

  return (
    <PublicPage
      seo={seo}
      eyebrow={blogContent.eyebrow}
      title={blogContent.title}
      description={blogContent.description}
    >
      {categories ? (
        <MotionReveal>
          <SectionTitle
            title={categories.title}
            description={categories.description}
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.items.map((item) => (
              <Badge key={item} variant="outline">
                {item}
              </Badge>
            ))}
          </div>
        </MotionReveal>
      ) : null}

      <EmptyState
        className="mt-12"
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
