import { Card } from "@/components/ui/Card";
import { EmptyState, PublicPage, SectionTitle } from "@/components/page";
import { contactContent } from "@/content/contact";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";

const Contacto = () => {
  const seo = getSeo(ROUTES.contacto);

  return (
    <PublicPage
      seo={seo}
      eyebrow={contactContent.eyebrow}
      title={contactContent.title}
      description={contactContent.description}
    >
      <SectionTitle
        title="Intentamos entender el problema"
        description="Esta página queda lista para un formulario conectado en una etapa posterior."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {contactContent.blocks?.map((block) => (
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
        title="Formulario pendiente de conexión"
        description="Por ahora no hay envío a backend. El mensaje principal permanece: cuéntanos qué problema tienes."
      />
    </PublicPage>
  );
};

export default Contacto;
