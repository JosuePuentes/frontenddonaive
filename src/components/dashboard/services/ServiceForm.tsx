import type { FormEvent } from "react";
import { FormField } from "@/components/dashboard/forms/FormField";
import { FormSection } from "@/components/dashboard/forms/FormSection";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import {
  PRICING_MODELS,
  PRICING_MODEL_LABELS,
  SERVICE_CATEGORY_KEYS,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CURRENCIES,
  type Service,
} from "@/types/services";

type ServiceFormProps = {
  initial?: Partial<Service>;
  submitLabel?: string;
};

const fieldClass =
  "min-h-24 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none";

const selectClass =
  "flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm";

function ServiceForm({
  initial,
  submitLabel = "Guardar (no disponible)",
}: ServiceFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="flex flex-wrap gap-2">
        <Badge variant="muted">Shell visual</Badge>
        <Badge variant="outline">Sin guardado</Badge>
      </div>

      <FormSection
        title="Datos del servicio"
        description="Formulario preparado para el catálogo administrativo. No persiste datos."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Nombre" htmlFor="name">
            <Input
              id="name"
              name="name"
              defaultValue={initial?.name ?? ""}
              placeholder="Nombre del servicio"
            />
          </FormField>
          <FormField label="Categoría" htmlFor="category">
            <select
              id="category"
              name="category"
              className={selectClass}
              defaultValue={initial?.category ?? ""}
            >
              <option value="" disabled>
                Selecciona
              </option>
              {SERVICE_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SERVICE_CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Descripción"
            htmlFor="description"
            className="md:col-span-2"
          >
            <textarea
              id="description"
              name="description"
              rows={4}
              className={fieldClass}
              defaultValue={initial?.description ?? ""}
              placeholder="Qué resuelve y para quién"
            />
          </FormField>
          <FormField label="Modelo de precio" htmlFor="pricingModel">
            <select
              id="pricingModel"
              name="pricingModel"
              className={selectClass}
              defaultValue={initial?.pricingModel ?? "custom"}
            >
              {PRICING_MODELS.map((model) => (
                <option key={model} value={model}>
                  {PRICING_MODEL_LABELS[model]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Moneda" htmlFor="currency">
            <select
              id="currency"
              name="currency"
              className={selectClass}
              defaultValue={initial?.currency ?? "USD"}
            >
              {SERVICE_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Precio base (opcional)" htmlFor="basePrice">
            <Input
              id="basePrice"
              name="basePrice"
              type="number"
              placeholder="Dejar vacío si es personalizado"
              defaultValue={
                initial?.basePrice == null ? "" : String(initial.basePrice)
              }
            />
          </FormField>
          <FormField label="Duración estimada" htmlFor="estimatedDuration">
            <Input
              id="estimatedDuration"
              name="estimatedDuration"
              defaultValue={initial?.estimatedDuration ?? ""}
              placeholder="Ej. 2–4 semanas"
            />
          </FormField>
          <FormField
            label="Entregables"
            htmlFor="deliverables"
            className="md:col-span-2"
          >
            <textarea
              id="deliverables"
              name="deliverables"
              rows={3}
              className={fieldClass}
              defaultValue={initial?.deliverables?.join("\n") ?? ""}
              placeholder="Uno por línea"
            />
          </FormField>
          <FormField label="Tags" htmlFor="tags" className="md:col-span-2">
            <Input
              id="tags"
              name="tags"
              defaultValue={initial?.tags?.join(", ") ?? ""}
              placeholder="Separados por coma"
            />
          </FormField>
        </div>
      </FormSection>

      <div className="flex justify-end">
        <Button type="submit" disabled title="Sin persistencia en esta etapa">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export { ServiceForm };
export type { ServiceFormProps };
