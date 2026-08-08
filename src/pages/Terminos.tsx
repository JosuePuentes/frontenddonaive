import { PublicPage, SectionTitle } from "@/components/page";
import { termsContent } from "@/content/legal";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Terminos = () => {
  const seo = getSeo(ROUTES.terminos);

  return (
    <PublicPage
      seo={seo}
      eyebrow="Legal"
      title={termsContent.title}
      description={termsContent.description}
    >
      <div className="space-y-10">
        {termsContent.sections.map((section) => (
          <section key={section.id} className="max-w-3xl">
            <SectionTitle title={section.title} />
            <div className="mt-4 space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-body text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PublicPage>
  );
};

export default Terminos;
