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
      <div className="flex items-start justify-between gap-2">
        <LeadStatusBadge status={opportunity.status} />
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
      <p className="text-caption text-muted-foreground">
        Valor estimado:{" "}
        {opportunity.estimatedValue != null
          ? `USD ${opportunity.estimatedValue.toLocaleString("es-VE")}`
          : "—"}
      </p>
    </Card>
  );
}

export { OpportunityCard };
export type { OpportunityCardProps };
