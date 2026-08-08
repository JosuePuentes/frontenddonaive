import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/page/EmptyState";
import type { Observation } from "@/types/diagnosis";
import {
  EVIDENCE_LEVEL_LABELS,
  OBSERVATION_AREA_LABELS,
} from "@/types/diagnosis";

type ObservationListProps = {
  observations: Observation[];
};

function ObservationList({ observations }: ObservationListProps) {
  if (observations.length === 0) {
    return (
      <EmptyState
        title="Sin observaciones"
        description="Las observaciones del diagnóstico aparecerán aquí."
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {observations.map((item) => (
        <li key={item.id}>
          <Card variant="outline" className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {OBSERVATION_AREA_LABELS[item.area] ?? item.area}
              </Badge>
              {item.evidenceLevel ? (
                <Badge variant="muted">
                  {EVIDENCE_LEVEL_LABELS[item.evidenceLevel]}
                </Badge>
              ) : null}
              {item.frequency ? (
                <Badge variant="default">{item.frequency}</Badge>
              ) : null}
            </div>
            {item.process ? (
              <p className="text-sm font-medium text-foreground">
                Proceso: {item.process}
              </p>
            ) : null}
            <p className="text-body-small text-muted-foreground">
              {item.description}
            </p>
            <div className="grid gap-1 text-caption text-muted-foreground sm:grid-cols-2">
              {item.responsible ? <p>Responsable: {item.responsible}</p> : null}
              {item.impact ? <p>Impacto: {item.impact}</p> : null}
              {item.evidence ? (
                <p className="sm:col-span-2">Evidencia: {item.evidence}</p>
              ) : null}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export { ObservationList };
export type { ObservationListProps };
