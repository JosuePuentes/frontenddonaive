import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OpportunityStatusBadge } from "@/modules/private/crm/components/OpportunityStatusBadge";
import type { Opportunity } from "@/types/crm";
import { cn } from "@/lib/utils";

type OpportunityCardProps = {
  opportunity: Opportunity;
  className?: string;
};

function OpportunityCard({ opportunity, className }: OpportunityCardProps) {
  const diagnosisRef =
    opportunity.diagnosisId ??
    (opportunity.diagnosisIds && opportunity.diagnosisIds[0]);
  const proposalRef =
    opportunity.primaryProposalId ??
    opportunity.proposalId ??
    (opportunity.proposalIds && opportunity.proposalIds[0]);

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
          <OpportunityStatusBadge status={opportunity.status} />
          {opportunity.hasProposal || proposalRef ? (
            <Badge variant="royal">Con propuesta</Badge>
          ) : null}
        </div>
        {opportunity.isDemo ? <Badge variant="muted">DEMO</Badge> : null}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {opportunity.organization ?? opportunity.organizationId ?? "—"}
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
        {diagnosisRef ? <p>Diagnóstico: {diagnosisRef}</p> : null}
        {proposalRef ? <p>Propuesta: {proposalRef}</p> : null}
      </div>
    </Card>
  );
}

export { OpportunityCard };
export type { OpportunityCardProps };
