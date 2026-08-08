import { Badge } from "@/components/ui/Badge";
import type { ProposalStatus } from "@/types/proposal";
import { PROPOSAL_STATUS_LABELS } from "@/types/proposal";

type ProposalStatusBadgeProps = {
  status: ProposalStatus;
};

const variantByStatus: Record<
  ProposalStatus,
  "default" | "electric" | "royal" | "outline" | "muted"
> = {
  draft: "muted",
  sent: "outline",
  viewed: "default",
  negotiation: "royal",
  accepted: "electric",
  rejected: "muted",
  expired: "outline",
};

function ProposalStatusBadge({ status }: ProposalStatusBadgeProps) {
  return (
    <Badge variant={variantByStatus[status]}>
      {PROPOSAL_STATUS_LABELS[status]}
    </Badge>
  );
}

export { ProposalStatusBadge };
export type { ProposalStatusBadgeProps };
