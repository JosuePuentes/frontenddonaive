import { PublicPage, SectionTitle } from "@/components/page";
import { privacyContent } from "@/content/legal";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Privacidad = () => {
  const seo = getSeo(ROUTES.privacidad);

  return (
    <PublicPage
      seo={seo}
      eyebrow="Legal"
      title={privacyContent.title}
      description={privacyContent.description}
    >
      <div className="space-y-10">
        {privacyContent.sections.map((section) => (
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

export default Privacidad;
