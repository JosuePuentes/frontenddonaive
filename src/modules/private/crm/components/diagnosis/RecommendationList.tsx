import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/page/EmptyState";
import type { Recommendation } from "@/types/diagnosis";
import {
  DIAGNOSIS_PRIORITY_LABELS,
  RECOMMENDATION_HORIZON_LABELS,
} from "@/types/diagnosis";

type RecommendationListProps = {
  recommendations: Recommendation[];
};

function RecommendationList({ recommendations }: RecommendationListProps) {
  const sorted = [...recommendations].sort((a, b) => a.sequence - b.sequence);

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="Sin recomendaciones"
        description="Las recomendaciones ordenadas aparecerán aquí."
      />
    );
  }

  return (
    <ol className="relative space-y-3 border-l border-border pl-4">
      {sorted.map((item) => (
        <li key={item.id} className="relative">
          <span
            className="absolute -left-[21px] top-3 size-2.5 rounded-full bg-primary"
            aria-hidden="true"
          />
          <Card variant="outline" className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="electric">#{item.sequence}</Badge>
              {item.horizon ? (
                <Badge variant="outline">
                  {RECOMMENDATION_HORIZON_LABELS[item.horizon]}
                </Badge>
              ) : null}
              {item.priority ? (
                <Badge variant="muted">
                  {DIAGNOSIS_PRIORITY_LABELS[item.priority]}
                </Badge>
              ) : null}
              {item.effort ? (
                <Badge variant="default">Esfuerzo: {item.effort}</Badge>
              ) : null}
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              {item.title}
            </h4>
            <p className="text-body-small text-muted-foreground">
              {item.description}
            </p>
            {item.impact ? (
              <p className="text-caption text-muted-foreground">
                Impacto: {item.impact}
              </p>
            ) : null}
          </Card>
        </li>
      ))}
    </ol>
  );
}

export { RecommendationList };
export type { RecommendationListProps };
