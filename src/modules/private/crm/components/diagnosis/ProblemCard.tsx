import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Problem } from "@/types/diagnosis";
import {
  DIAGNOSIS_PRIORITY_LABELS,
  EVIDENCE_LEVEL_LABELS,
} from "@/types/diagnosis";

type ProblemCardProps = {
  problem: Problem;
};

function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Card variant="default" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="electric">Problema</Badge>
        {problem.severity ? (
          <Badge variant="outline">
            {DIAGNOSIS_PRIORITY_LABELS[problem.severity]}
          </Badge>
        ) : null}
        {problem.evidenceLevel ? (
          <Badge variant="muted">
            {EVIDENCE_LEVEL_LABELS[problem.evidenceLevel]}
          </Badge>
        ) : null}
      </div>
      <p className="text-body text-foreground">{problem.description}</p>
      <div className="grid gap-1 text-caption text-muted-foreground sm:grid-cols-2">
        {problem.origin ? <p>Origen: {problem.origin}</p> : null}
        {problem.frequency ? <p>Frecuencia: {problem.frequency}</p> : null}
        {problem.affectedArea ? <p>Área: {problem.affectedArea}</p> : null}
        {problem.affectedPeople ? (
          <p>Personas: {problem.affectedPeople}</p>
        ) : null}
        {problem.evidence ? (
          <p className="sm:col-span-2">Evidencia: {problem.evidence}</p>
        ) : null}
      </div>
    </Card>
  );
}

export { ProblemCard };
export type { ProblemCardProps };
