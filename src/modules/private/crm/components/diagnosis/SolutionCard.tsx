import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Solution } from "@/types/diagnosis";
import {
  DIAGNOSIS_PRIORITY_LABELS,
  SOLUTION_TYPE_LABELS,
} from "@/types/diagnosis";

type SolutionCardProps = {
  solution: Solution;
};

function SolutionCard({ solution }: SolutionCardProps) {
  return (
    <Card variant="default" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="royal">{SOLUTION_TYPE_LABELS[solution.type]}</Badge>
        {solution.priority ? (
          <Badge variant="outline">
            {DIAGNOSIS_PRIORITY_LABELS[solution.priority]}
          </Badge>
        ) : null}
        {solution.estimatedComplexity ? (
          <Badge variant="muted">
            Complejidad: {solution.estimatedComplexity}
          </Badge>
        ) : null}
      </div>
      <p className="text-body-small text-foreground">{solution.description}</p>
      {solution.components && solution.components.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {solution.components.map((component) => (
            <Badge key={component} variant="default">
              {component}
            </Badge>
          ))}
        </div>
      ) : null}
      {solution.dependencies && solution.dependencies.length > 0 ? (
        <p className="text-caption text-muted-foreground">
          Dependencias: {solution.dependencies.join(", ")}
        </p>
      ) : null}
    </Card>
  );
}

export { SolutionCard };
export type { SolutionCardProps };
