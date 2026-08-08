import { useState, type FormEvent } from "react";
import { FormField } from "@/components/dashboard/forms/FormField";
import { FormSection } from "@/components/dashboard/forms/FormSection";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { demoServices } from "@/constants/services-demo";
import { SERVICE_CATEGORY_LABELS } from "@/types/services";

type ProposalWizardShellProps = {
  diagnosisId?: string | null;
  opportunityId?: string | null;
};

const fieldClass =
  "min-h-24 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none";

const selectClass =
  "flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm";

const stages = [
  { key: "relations", label: "Relaciones" },
  { key: "services", label: "Servicios" },
  { key: "content", label: "Contenido" },
  { key: "investment", label: "Inversión" },
] as const;

function ProposalWizardShell({
  diagnosisId,
  opportunityId,
}: ProposalWizardShellProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function toggleService(id: string) {
    setSelectedServices((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  const stage = stages[stageIndex];

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="flex flex-wrap gap-2">
        <Badge variant="muted">Shell visual</Badge>
        <Badge variant="outline">Sin guardado</Badge>
        {diagnosisId ? (
          <Badge variant="electric">Diagnóstico: {diagnosisId}</Badge>
        ) : null}
        {opportunityId ? (
          <Badge variant="outline">Oportunidad: {opportunityId}</Badge>
        ) : null}
      </div>

      <ol className="flex gap-1 overflow-x-auto pb-1">
        {stages.map((item, index) => (
          <li key={item.key}>
            <button
              type="button"
              className={cn(
                "shrink-0 rounded-[var(--radius-md)] px-2.5 py-1.5 text-caption font-medium",
                index === stageIndex
                  ? "bg-primary text-primary-foreground"
                  : index < stageIndex
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-muted text-muted-foreground",
              )}
              onClick={() => setStageIndex(index)}
            >
              {index + 1}. {item.label}
            </button>
          </li>
        ))}
      </ol>

      {stage.key === "relations" ? (
        <FormSection
          title="Cliente, oportunidad y diagnóstico"
          description="Vínculos conceptuales Diagnosis → Proposal. Sin persistencia."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Cliente / Organización" htmlFor="client">
              <Input id="client" name="client" placeholder="Nombre DEMO o ID" />
            </FormField>
            <FormField label="Oportunidad" htmlFor="opportunityId">
              <Input
                id="opportunityId"
                name="opportunityId"
                defaultValue={opportunityId ?? ""}
                placeholder="ID de oportunidad"
              />
            </FormField>
            <FormField
              label="Diagnóstico"
              htmlFor="diagnosisId"
              className="md:col-span-2"
            >
              <Input
                id="diagnosisId"
                name="diagnosisId"
                defaultValue={diagnosisId ?? ""}
                placeholder="ID de diagnóstico"
              />
            </FormField>
            <FormField label="Título" htmlFor="title" className="md:col-span-2">
              <Input id="title" name="title" placeholder="Título de la propuesta" />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      {stage.key === "services" ? (
        <FormSection
          title="Seleccionar servicios"
          description="Combine servicios del catálogo. Ejemplos DEMO solo ilustran la UI."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {demoServices.map((service) => {
              const selected = selectedServices.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className="text-left"
                >
                  <Card
                    variant={selected ? "default" : "outline"}
                    className={cn(
                      "space-y-2 p-4 transition-colors",
                      selected && "border-primary/40",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">
                        {SERVICE_CATEGORY_LABELS[service.category]}
                      </Badge>
                      <Badge variant="muted">DEMO</Badge>
                      {selected ? (
                        <Badge variant="electric">Seleccionado</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-caption text-muted-foreground">
                      {service.description}
                    </p>
                  </Card>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-caption text-muted-foreground">
            Seleccionados: {selectedServices.length || "ninguno"}
          </p>
        </FormSection>
      ) : null}

      {stage.key === "content" ? (
        <FormSection
          title="Resumen, entregables y condiciones"
          description="La inversión se define después de explicar valor y alcance."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Resumen" htmlFor="summary" className="md:col-span-2">
              <textarea id="summary" name="summary" rows={3} className={fieldClass} />
            </FormField>
            <FormField label="Problema" htmlFor="problem" className="md:col-span-2">
              <textarea id="problem" name="problem" rows={2} className={fieldClass} />
            </FormField>
            <FormField label="Solución" htmlFor="solution" className="md:col-span-2">
              <textarea id="solution" name="solution" rows={2} className={fieldClass} />
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
                placeholder="Uno por línea"
              />
            </FormField>
            <FormField label="Condiciones" htmlFor="conditions" className="md:col-span-2">
              <textarea id="conditions" name="conditions" rows={2} className={fieldClass} />
            </FormField>
            <FormField label="Vigencia" htmlFor="validUntil">
              <Input id="validUntil" name="validUntil" placeholder="Fecha o DEMO" />
            </FormField>
            <FormField label="Notas" htmlFor="notes">
              <Input id="notes" name="notes" />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      {stage.key === "investment" ? (
        <FormSection
          title="Precio e inversión"
          description="Campos preparados. No hay cálculo fiscal ni precios reales."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Moneda" htmlFor="currency">
              <select id="currency" name="currency" className={selectClass} defaultValue="USD">
                <option value="USD">USD</option>
                <option value="VES">VES</option>
                <option value="EUR">EUR</option>
              </select>
            </FormField>
            <FormField label="Subtotal" htmlFor="subtotal">
              <Input
                id="subtotal"
                name="subtotal"
                type="number"
                placeholder="Opcional — no inventar"
              />
            </FormField>
            <FormField label="Descuento" htmlFor="discount">
              <Input id="discount" name="discount" type="number" placeholder="Opcional" />
            </FormField>
            <FormField label="Impuesto" htmlFor="tax">
              <Input id="tax" name="tax" type="number" placeholder="Opcional" />
            </FormField>
            <FormField label="Total" htmlFor="total" className="md:col-span-2">
              <Input id="total" name="total" type="number" placeholder="Opcional — sin cálculo automático" />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStageIndex((value) => Math.max(0, value - 1))}
          disabled={stageIndex === 0}
        >
          Anterior
        </Button>
        <p className="text-caption text-muted-foreground">
          Etapa {stageIndex + 1} de {stages.length}
        </p>
        {stageIndex < stages.length - 1 ? (
          <Button
            type="button"
            onClick={() =>
              setStageIndex((value) => Math.min(stages.length - 1, value + 1))
            }
          >
            Siguiente
          </Button>
        ) : (
          <Button type="submit" disabled title="Sin persistencia">
            Guardar propuesta (no disponible)
          </Button>
        )}
      </div>
    </form>
  );
}

export { ProposalWizardShell };
export type { ProposalWizardShellProps };
