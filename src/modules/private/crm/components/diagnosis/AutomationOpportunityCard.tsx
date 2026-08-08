import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { AutomationOpportunity } from "@/types/diagnosis";
import {
  AUTOMATION_TYPE_LABELS,
  DIAGNOSIS_PRIORITY_LABELS,
} from "@/types/diagnosis";

type AutomationOpportunityCardProps = {
  item: AutomationOpportunity;
};

function AutomationOpportunityCard({ item }: AutomationOpportunityCardProps) {
  return (
    <Card variant="outline" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="electric">
          {AUTOMATION_TYPE_LABELS[item.automationType]}
        </Badge>
        {item.priority ? (
          <Badge variant="outline">
            {DIAGNOSIS_PRIORITY_LABELS[item.priority]}
          </Badge>
        ) : null}
        {item.complexity ? (
          <Badge variant="muted">Complejidad: {item.complexity}</Badge>
        ) : null}
      </div>
      <p className="text-sm font-medium text-foreground">{item.opportunity}</p>
      <div className="space-y-1 text-caption text-muted-foreground">
        <p>Proceso: {item.process}</p>
        <p>Problema: {item.problem}</p>
        {item.expectedBenefit ? <p>Beneficio: {item.expectedBenefit}</p> : null}
      </div>
    </Card>
  );
}

export { AutomationOpportunityCard };
export type { AutomationOpportunityCardProps };
