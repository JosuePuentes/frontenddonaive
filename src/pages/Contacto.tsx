import type { FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { PublicPage, SectionTitle } from "@/components/page";
import { MotionReveal } from "@/components/landing/MotionReveal";
import { contactContent } from "@/content/contact";
import { ROUTES } from "@/constants/routes";
import { getSeo } from "@/constants/seo";
import type { ContactFormField } from "@/types/content";

function FieldControl({ field }: { field: ContactFormField }) {
  const baseClassName =
    "flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

  if (field.type === "textarea") {
    return (
      <textarea
        id={field.id}
        name={field.id}
        rows={5}
        placeholder={field.placeholder}
        required={field.required}
        className="min-h-32 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        id={field.id}
        name={field.id}
        required={field.required}
        defaultValue=""
        className={baseClassName}
      >
        <option value="" disabled>
          Selecciona una opción
        </option>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      id={field.id}
      name={field.id}
      type={field.type}
      placeholder={field.placeholder}
      required={field.required}
    />
  );
}

const Contacto = () => {
  const seo = getSeo(ROUTES.contacto);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <PublicPage
      seo={seo}
      eyebrow={contactContent.eyebrow}
      title={contactContent.title}
      description={contactContent.description}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <SectionTitle
            title={contactContent.supportingTitle}
            description={contactContent.supportingDescription}
          />
          <div className="grid gap-4">
            {contactContent.blocks?.map((block) => (
              <Card key={block.id} variant="default">
                <h2 className="text-h3">{block.title}</h2>
                <p className="mt-3 text-body-small text-muted-foreground">
                  {block.description}
                </p>
              </Card>
            ))}
          </div>
          <Card variant="outline" className="border-primary/20 bg-primary/5">
            <p className="text-body text-foreground">
              {contactContent.closingMessage}
            </p>
          </Card>
        </div>

        <MotionReveal>
          <Card variant="elevated" className="p-6 sm:p-8">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Formulario visual</Badge>
              <Badge variant="muted">Sin envío</Badge>
            </div>
            <p className="text-body-small text-muted-foreground">
              {contactContent.formIntro}
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                {contactContent.fields.map((field) => (
                  <div
                    key={field.id}
                    className={
                      field.type === "textarea" || field.id === "problema"
                        ? "sm:col-span-2"
                        : undefined
                    }
                  >
                    <label
                      htmlFor={field.id}
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      {field.label}
                      {field.required ? (
                        <span className="text-danger"> *</span>
                      ) : null}
                    </label>
                    <FieldControl field={field} />
                  </div>
                ))}
              </div>

              <p className="text-caption text-muted-foreground">
                {contactContent.formNote}
              </p>

              <Button type="submit" className="w-full sm:w-auto">
                {contactContent.ctaLabel}
              </Button>
            </form>
          </Card>
        </MotionReveal>
      </div>
    </PublicPage>
  );
};

export default Contacto;
