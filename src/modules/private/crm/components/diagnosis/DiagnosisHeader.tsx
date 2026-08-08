import { Link } from "react-router";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DASHBOARD_ROUTES } from "@/constants/dashboard-routes";
import type { Diagnosis } from "@/types/diagnosis";
import {
  DIAGNOSIS_PRIORITY_LABELS,
  DIAGNOSIS_STATUS_LABELS,
} from "@/types/diagnosis";

type DiagnosisHeaderProps = {
  diagnosis: Diagnosis;
  onCreateProposal?: boolean;
};

function DiagnosisHeader({
  diagnosis,
  onCreateProposal = true,
}: DiagnosisHeaderProps) {
  return (
    <Card variant="default" className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {diagnosis.isDemo ? <Badge variant="muted">DEMO</Badge> : null}
            <Badge variant="outline">
              {DIAGNOSIS_STATUS_LABELS[diagnosis.status]}
            </Badge>
            <Badge variant="electric">
              Prioridad: {DIAGNOSIS_PRIORITY_LABELS[diagnosis.priority]}
            </Badge>
          </div>
          <h2 className="text-h3 break-words">{diagnosis.title}</h2>
          {diagnosis.summary ? (
            <p className="max-w-3xl text-body-small text-muted-foreground">
              {diagnosis.summary}
            </p>
          ) : null}
        </div>

        {onCreateProposal ? (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={DASHBOARD_ROUTES.crmPropuestas}>Crear propuesta</Link>
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-2 text-caption text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <p>
          Lead:{" "}
          <span className="text-foreground">{diagnosis.leadId ?? "—"}</span>
        </p>
        <p>
          Organización:{" "}
          <span className="text-foreground">
            {diagnosis.organizationId ?? "—"}
          </span>
        </p>
        <p>
          Creado:{" "}
          <span className="text-foreground">
            {diagnosis.isDemo ? "DEMO" : diagnosis.createdAt}
          </span>
        </p>
        <p>
          Actualizado:{" "}
          <span className="text-foreground">
            {diagnosis.isDemo ? "DEMO" : diagnosis.updatedAt}
          </span>
        </p>
      </div>
    </Card>
  );
}

export { DiagnosisHeader };
export type { DiagnosisHeaderProps };
