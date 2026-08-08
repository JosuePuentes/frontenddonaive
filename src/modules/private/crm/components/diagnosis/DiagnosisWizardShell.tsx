import { useState, type FormEvent } from "react";
import { FormField } from "@/components/dashboard/forms/FormField";
import { FormSection } from "@/components/dashboard/forms/FormSection";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DIAGNOSIS_FORM_STAGES,
  DIAGNOSIS_PRIORITIES,
  DIAGNOSIS_PRIORITY_LABELS,
  EVIDENCE_LEVELS,
  EVIDENCE_LEVEL_LABELS,
  OBSERVATION_AREAS,
  OBSERVATION_AREA_LABELS,
  ROOT_CAUSE_CATEGORIES,
  ROOT_CAUSE_CATEGORY_LABELS,
  IMPACT_CATEGORIES,
  IMPACT_CATEGORY_LABELS,
  AUTOMATION_TYPES,
  AUTOMATION_TYPE_LABELS,
  SOLUTION_TYPES,
  SOLUTION_TYPE_LABELS,
  RECOMMENDATION_HORIZONS,
  RECOMMENDATION_HORIZON_LABELS,
  type DiagnosisFormStageKey,
} from "@/types/diagnosis";

type DiagnosisWizardShellProps = {
  leadId?: string | null;
};

const fieldClass =
  "min-h-24 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60";

const selectClass =
  "flex h-10 w-full rounded-[var(--radius-md)] border border-border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60";

function DiagnosisWizardShell({ leadId }: DiagnosisWizardShellProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = DIAGNOSIS_FORM_STAGES[stageIndex];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function goNext() {
    setStageIndex((current) =>
      Math.min(current + 1, DIAGNOSIS_FORM_STAGES.length - 1),
    );
  }

  function goPrev() {
    setStageIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="muted">Shell visual</Badge>
        <Badge variant="outline">Sin guardado</Badge>
        {leadId ? <Badge variant="electric">Lead: {leadId}</Badge> : null}
      </div>

      <ol className="flex gap-1 overflow-x-auto pb-1">
        {DIAGNOSIS_FORM_STAGES.map((item, index) => (
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
              {item.step}. {item.label}
            </button>
          </li>
        ))}
      </ol>

      <FormSection
        title={`Etapa ${stage.step}: ${stage.label}`}
        description="Formulario preparado para futura persistencia. No envía ni guarda datos."
      >
        {stage.key === "context" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Título" htmlFor="title">
              <Input id="title" name="title" placeholder="Título del diagnóstico" />
            </FormField>
            <FormField label="Prioridad" htmlFor="priority">
              <select id="priority" name="priority" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                {DIAGNOSIS_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {DIAGNOSIS_PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Lead relacionado" htmlFor="leadId" className="md:col-span-2">
              <Input
                id="leadId"
                name="leadId"
                defaultValue={leadId ?? ""}
                placeholder="ID de lead (opcional)"
              />
            </FormField>
            <FormField label="Resumen" htmlFor="summary" className="md:col-span-2">
              <textarea
                id="summary"
                name="summary"
                rows={3}
                className={fieldClass}
                placeholder="Contexto general del diagnóstico"
              />
            </FormField>
          </div>
        ) : null}

        {stage.key === "observation" ? (
          <ObservationStageFields />
        ) : null}

        {stage.key === "problem" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Descripción del problema" htmlFor="problemDescription" className="md:col-span-2">
              <textarea id="problemDescription" name="problemDescription" rows={3} className={fieldClass} />
            </FormField>
            <FormField label="Origen" htmlFor="problemOrigin">
              <Input id="problemOrigin" name="problemOrigin" />
            </FormField>
            <FormField label="Frecuencia" htmlFor="problemFrequency">
              <Input id="problemFrequency" name="problemFrequency" />
            </FormField>
            <FormField label="Área afectada" htmlFor="affectedArea">
              <Input id="affectedArea" name="affectedArea" />
            </FormField>
            <FormField label="Personas afectadas" htmlFor="affectedPeople">
              <Input id="affectedPeople" name="affectedPeople" />
            </FormField>
            <FormField label="Nivel de evidencia" htmlFor="problemEvidenceLevel">
              <select id="problemEvidenceLevel" name="problemEvidenceLevel" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                {EVIDENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {EVIDENCE_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Evidencia" htmlFor="problemEvidence">
              <Input id="problemEvidence" name="problemEvidence" />
            </FormField>
          </div>
        ) : null}

        {stage.key === "cause" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Causa" htmlFor="cause" className="md:col-span-2">
              <textarea id="cause" name="cause" rows={3} className={fieldClass} />
            </FormField>
            <FormField label="Categoría" htmlFor="causeCategory">
              <select id="causeCategory" name="causeCategory" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                {ROOT_CAUSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {ROOT_CAUSE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Confianza" htmlFor="causeConfidence">
              <select id="causeConfidence" name="causeConfidence" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                {EVIDENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {EVIDENCE_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Evidencia" htmlFor="causeEvidence" className="md:col-span-2">
              <textarea id="causeEvidence" name="causeEvidence" rows={2} className={fieldClass} />
            </FormField>
          </div>
        ) : null}

        {stage.key === "impact" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Categoría de impacto" htmlFor="impactCategory">
              <select id="impactCategory" name="impactCategory" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                {IMPACT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {IMPACT_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Frecuencia" htmlFor="impactFrequency">
              <Input id="impactFrequency" name="impactFrequency" />
            </FormField>
            <FormField label="Descripción" htmlFor="impactDescription" className="md:col-span-2">
              <textarea id="impactDescription" name="impactDescription" rows={3} className={fieldClass} />
            </FormField>
            <FormField
              label="Valor estimado (opcional)"
              htmlFor="estimatedValue"
              className="md:col-span-2"
            >
              <Input
                id="estimatedValue"
                name="estimatedValue"
                type="number"
                placeholder="Dejar vacío si no hay cifra"
              />
            </FormField>
          </div>
        ) : null}

        {stage.key === "current_process" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Paso" htmlFor="processStep">
              <Input id="processStep" name="processStep" type="number" min={1} />
            </FormField>
            <FormField label="Responsable" htmlFor="processResponsible">
              <Input id="processResponsible" name="processResponsible" />
            </FormField>
            <FormField label="Entrada" htmlFor="processInput">
              <Input id="processInput" name="processInput" />
            </FormField>
            <FormField label="Acción" htmlFor="processAction">
              <Input id="processAction" name="processAction" />
            </FormField>
            <FormField label="Salida" htmlFor="processOutput">
              <Input id="processOutput" name="processOutput" />
            </FormField>
            <FormField label="Sistema" htmlFor="processSystem">
              <Input id="processSystem" name="processSystem" />
            </FormField>
            <FormField label="Problema en el paso" htmlFor="processProblem" className="md:col-span-2">
              <textarea id="processProblem" name="processProblem" rows={2} className={fieldClass} />
            </FormField>
          </div>
        ) : null}

        {stage.key === "opportunities" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Proceso" htmlFor="autoProcess">
              <Input id="autoProcess" name="autoProcess" />
            </FormField>
            <FormField label="Tipo de automatización" htmlFor="automationType">
              <select id="automationType" name="automationType" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                {AUTOMATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {AUTOMATION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Problema" htmlFor="autoProblem" className="md:col-span-2">
              <Input id="autoProblem" name="autoProblem" />
            </FormField>
            <FormField label="Oportunidad" htmlFor="autoOpportunity" className="md:col-span-2">
              <textarea id="autoOpportunity" name="autoOpportunity" rows={3} className={fieldClass} />
            </FormField>
            <FormField label="Beneficio esperado" htmlFor="expectedBenefit" className="md:col-span-2">
              <Input id="expectedBenefit" name="expectedBenefit" />
            </FormField>
          </div>
        ) : null}

        {stage.key === "solution" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Tipo de solución" htmlFor="solutionType">
              <select id="solutionType" name="solutionType" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                {SOLUTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SOLUTION_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Complejidad estimada" htmlFor="solutionComplexity">
              <select id="solutionComplexity" name="solutionComplexity" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </FormField>
            <FormField label="Descripción" htmlFor="solutionDescription" className="md:col-span-2">
              <textarea id="solutionDescription" name="solutionDescription" rows={3} className={fieldClass} />
            </FormField>
            <FormField label="Componentes" htmlFor="solutionComponents" className="md:col-span-2">
              <Input
                id="solutionComponents"
                name="solutionComponents"
                placeholder="Separados por coma"
              />
            </FormField>
          </div>
        ) : null}

        {stage.key === "recommendations" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Título" htmlFor="recTitle">
              <Input id="recTitle" name="recTitle" />
            </FormField>
            <FormField label="Horizonte" htmlFor="recHorizon">
              <select id="recHorizon" name="recHorizon" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                {RECOMMENDATION_HORIZONS.map((horizon) => (
                  <option key={horizon} value={horizon}>
                    {RECOMMENDATION_HORIZON_LABELS[horizon]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Descripción" htmlFor="recDescription" className="md:col-span-2">
              <textarea id="recDescription" name="recDescription" rows={3} className={fieldClass} />
            </FormField>
            <FormField label="Secuencia" htmlFor="recSequence">
              <Input id="recSequence" name="recSequence" type="number" min={1} />
            </FormField>
            <FormField label="Esfuerzo" htmlFor="recEffort">
              <select id="recEffort" name="recEffort" className={selectClass} defaultValue="">
                <option value="" disabled>
                  Selecciona
                </option>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
              </select>
            </FormField>
          </div>
        ) : null}
      </FormSection>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={goPrev} disabled={stageIndex === 0}>
          Anterior
        </Button>
        <p className="text-caption text-muted-foreground">
          Etapa {stage.step} de {DIAGNOSIS_FORM_STAGES.length}
        </p>
        {stageIndex < DIAGNOSIS_FORM_STAGES.length - 1 ? (
          <Button type="button" onClick={goNext}>
            Siguiente
          </Button>
        ) : (
          <Button type="submit" disabled title="Sin persistencia en esta etapa">
            Guardar (no disponible)
          </Button>
        )}
      </div>
    </form>
  );
}

function ObservationStageFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField label="Área" htmlFor="obsArea">
        <select id="obsArea" name="obsArea" className={selectClass} defaultValue="">
          <option value="" disabled>
            Selecciona
          </option>
          {OBSERVATION_AREAS.map((area) => (
            <option key={area} value={area}>
              {OBSERVATION_AREA_LABELS[area]}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Proceso" htmlFor="obsProcess">
        <Input id="obsProcess" name="obsProcess" />
      </FormField>
      <FormField label="Descripción" htmlFor="obsDescription" className="md:col-span-2">
        <textarea id="obsDescription" name="obsDescription" rows={3} className={fieldClass} />
      </FormField>
      <FormField label="Evidencia" htmlFor="obsEvidence">
        <Input id="obsEvidence" name="obsEvidence" />
      </FormField>
      <FormField label="Frecuencia" htmlFor="obsFrequency">
        <Input id="obsFrequency" name="obsFrequency" />
      </FormField>
      <FormField label="Responsable" htmlFor="obsResponsible">
        <Input id="obsResponsible" name="obsResponsible" />
      </FormField>
      <FormField label="Impacto observado" htmlFor="obsImpact">
        <Input id="obsImpact" name="obsImpact" />
      </FormField>
    </div>
  );
}

export { DiagnosisWizardShell };
export type { DiagnosisWizardShellProps, DiagnosisFormStageKey };
