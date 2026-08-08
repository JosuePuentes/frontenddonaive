import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LeadStatusBadge } from "@/modules/private/crm/components/LeadStatusBadge";
import type { Opportunity } from "@/types/crm";
import { cn } from "@/lib/utils";

type OpportunityCardProps = {
  opportunity: Opportunity;
  className?: string;
};

function OpportunityCard({ opportunity, className }: OpportunityCardProps) {
  return (
    <Card
      variant="default"
      className={cn(
        "space-y-3 p-4 shadow-sm",
        opportunity.isDemo && "border-dashed",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <LeadStatusBadge status={opportunity.status} />
          {opportunity.hasProposal || opportunity.proposalId ? (
            <Badge variant="royal">Con propuesta</Badge>
          ) : null}
        </div>
        {opportunity.isDemo ? <Badge variant="muted">DEMO</Badge> : null}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {opportunity.organization}
        </p>
        <p className="mt-1 text-body-small text-muted-foreground">
          {opportunity.problem}
        </p>
      </div>
      <div className="space-y-1 text-caption text-muted-foreground">
        <p>
          Valor estimado:{" "}
          {opportunity.estimatedValue != null
            ? `USD ${opportunity.estimatedValue.toLocaleString("es-VE")}`
            : "—"}
        </p>
        {opportunity.diagnosisId ? (
          <p>Diagnóstico: {opportunity.diagnosisId}</p>
        ) : null}
        {opportunity.proposalId ? (
          <p>Propuesta: {opportunity.proposalId}</p>
        ) : null}
      </div>
    </Card>
  );
}

export { OpportunityCard };
export type { OpportunityCardProps };
