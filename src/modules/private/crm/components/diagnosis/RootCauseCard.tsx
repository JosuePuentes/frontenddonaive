import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { RootCause } from "@/types/diagnosis";
import {
  EVIDENCE_LEVEL_LABELS,
  ROOT_CAUSE_CATEGORY_LABELS,
} from "@/types/diagnosis";

type RootCauseCardProps = {
  cause: RootCause;
};

function RootCauseCard({ cause }: RootCauseCardProps) {
  return (
    <Card variant="outline" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="royal">
          {ROOT_CAUSE_CATEGORY_LABELS[cause.category]}
        </Badge>
        {cause.confidence ? (
          <Badge variant="muted">
            {EVIDENCE_LEVEL_LABELS[cause.confidence]}
          </Badge>
        ) : null}
      </div>
      <p className="text-body text-foreground">{cause.cause}</p>
      {cause.evidence ? (
        <p className="text-caption text-muted-foreground">
          Evidencia: {cause.evidence}
        </p>
      ) : null}
      <p className="text-caption text-muted-foreground">
        La causa no se afirma como definitiva hasta validarla.
      </p>
    </Card>
  );
}

export { RootCauseCard };
export type { RootCauseCardProps };
