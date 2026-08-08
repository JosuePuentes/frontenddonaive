import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Diagnosis, DiagnosisScoreDimensions } from "@/types/diagnosis";
import { DIAGNOSIS_PRIORITY_LABELS } from "@/types/diagnosis";

type DiagnosisSummaryProps = {
  diagnosis: Diagnosis;
  observationCount?: number;
  problemCount?: number;
  causeCount?: number;
  impactCount?: number;
  recommendationCount?: number;
};

const SCORE_LABELS: Record<keyof DiagnosisScoreDimensions, string> = {
  severity: "Severidad",
  impact: "Impacto",
  urgency: "Urgencia",
  complexity: "Complejidad",
  automationPotential: "Potencial de automatización",
};

function DiagnosisSummary({
  diagnosis,
  observationCount = 0,
  problemCount = 0,
  causeCount = 0,
  impactCount = 0,
  recommendationCount = 0,
}: DiagnosisSummaryProps) {
  const score = diagnosis.score;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card variant="default" className="space-y-3">
        <h3 className="text-base font-semibold">Resumen del diagnóstico</h3>
        <p className="text-body-small text-muted-foreground">
          {diagnosis.summary ??
            "Sin resumen. El diagnóstico ayudará a pasar del problema a la solución estructurada."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            Prioridad: {DIAGNOSIS_PRIORITY_LABELS[diagnosis.priority]}
          </Badge>
          {diagnosis.isDemo ? <Badge variant="muted">DEMO</Badge> : null}
        </div>
      </Card>

      <Card variant="outline" className="space-y-3">
        <h3 className="text-base font-semibold">Cobertura</h3>
        <ul className="grid grid-cols-2 gap-2 text-body-small text-muted-foreground">
          <li>Observaciones: {observationCount}</li>
          <li>Problemas: {problemCount}</li>
          <li>Causas: {causeCount}</li>
          <li>Impactos: {impactCount}</li>
          <li className="col-span-2">
            Recomendaciones: {recommendationCount}
          </li>
        </ul>
      </Card>

      <Card variant="ghost" className="space-y-3 border border-dashed border-border lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">Score (estructura)</h3>
          <Badge variant="muted">Sin fórmula automática</Badge>
        </div>
        <p className="text-caption text-muted-foreground">
          Dimensiones preparadas para un modelo de scoring futuro. No se calcula
          puntuación en esta etapa.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(
            Object.keys(SCORE_LABELS) as Array<keyof DiagnosisScoreDimensions>
          ).map((key) => (
            <div
              key={key}
              className="rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2"
            >
              <p className="text-caption text-muted-foreground">
                {SCORE_LABELS[key]}
              </p>
              <p className="text-sm font-medium text-foreground">
                {score?.[key] == null ? "—" : String(score[key])}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export { DiagnosisSummary };
export type { DiagnosisSummaryProps };
