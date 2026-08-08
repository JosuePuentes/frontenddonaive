import { FormField } from "@/components/dashboard/forms/FormField";
import { FormSection } from "@/components/dashboard/forms/FormSection";
import { Input } from "@/components/ui/input";
import { DIAGNOSIS_PRIORITIES } from "@/types/crm";

const fields = [
  { id: "observedProblem", label: "Problema observado", type: "textarea" },
  { id: "probableCause", label: "Causa probable", type: "textarea" },
  { id: "impact", label: "Impacto", type: "textarea" },
  { id: "priority", label: "Prioridad", type: "select" },
  { id: "affectedProcess", label: "Proceso afectado", type: "text" },
  {
    id: "improvementOpportunity",
    label: "Oportunidad de mejora",
    type: "textarea",
  },
  { id: "proposedSolution", label: "Solución propuesta", type: "textarea" },
  {
    id: "possibleAutomation",
    label: "Automatización posible",
    type: "textarea",
  },
  {
    id: "requiredTechnology",
    label: "Tecnología necesaria",
    type: "textarea",
  },
] as const;

function DiagnosisFormShell() {
  return (
    <FormSection
      title="Estructura de diagnóstico"
      description="Campos preparados para registrar un diagnóstico inicial. Sin persistencia en esta etapa."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <FormField
            key={field.id}
            label={field.label}
            htmlFor={field.id}
            className={field.type === "textarea" ? "md:col-span-2" : undefined}
          >
            {field.type === "textarea" ? (
              <textarea
                id={field.id}
                name={field.id}
                rows={3}
                disabled
                className="min-h-24 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Pendiente de conexión"
              />
            ) : field.type === "select" ? (
              <select
                id={field.id}
                name={field.id}
                disabled
                className="flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona prioridad
                </option>
                {DIAGNOSIS_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            ) : (
              <Input
                id={field.id}
                name={field.id}
                disabled
                placeholder="Pendiente de conexión"
              />
            )}
          </FormField>
        ))}
      </div>
    </FormSection>
  );
}

export { DiagnosisFormShell };
