import { Badge } from "@/components/ui/Badge";
import {
  OPPORTUNITY_STATUS_LABELS,
  type OpportunityStatus,
} from "@/types/crm";

type OpportunityStatusBadgeProps = {
  status: OpportunityStatus;
};

function OpportunityStatusBadge({ status }: OpportunityStatusBadgeProps) {
  const variant =
    status === "won"
      ? "electric"
      : status === "lost"
        ? "muted"
        : status === "negotiation" || status === "proposal"
          ? "royal"
          : status === "on_hold"
            ? "muted"
            : "outline";

  return <Badge variant={variant}>{OPPORTUNITY_STATUS_LABELS[status]}</Badge>;
}

export { OpportunityStatusBadge };
export type { OpportunityStatusBadgeProps };
