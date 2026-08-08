import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Impact } from "@/types/diagnosis";
import {
  DIAGNOSIS_PRIORITY_LABELS,
  IMPACT_CATEGORY_LABELS,
} from "@/types/diagnosis";

type ImpactCardProps = {
  impact: Impact;
};

function ImpactCard({ impact }: ImpactCardProps) {
  return (
    <Card variant="default" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {IMPACT_CATEGORY_LABELS[impact.category]}
        </Badge>
        {impact.severity ? (
          <Badge variant="muted">
            {DIAGNOSIS_PRIORITY_LABELS[impact.severity]}
          </Badge>
        ) : null}
        {impact.frequency ? (
          <Badge variant="default">{impact.frequency}</Badge>
        ) : null}
      </div>
      <p className="text-body-small text-foreground">{impact.description}</p>
      <p className="text-caption text-muted-foreground">
        Valor estimado:{" "}
        {impact.estimatedValue == null
          ? "No definido"
          : String(impact.estimatedValue)}
      </p>
    </Card>
  );
}

export { ImpactCard };
export type { ImpactCardProps };
