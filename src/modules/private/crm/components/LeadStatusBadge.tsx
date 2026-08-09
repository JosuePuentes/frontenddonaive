import { Badge } from "@/components/ui/Badge";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/types/crm";

type LeadStatusBadgeProps = {
  status: LeadStatus;
};

function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const variant =
    status === "qualified"
      ? "electric"
      : status === "disqualified"
        ? "muted"
        : status === "qualifying" || status === "recycled"
          ? "royal"
          : "outline";

  return <Badge variant={variant}>{LEAD_STATUS_LABELS[status]}</Badge>;
}

export { LeadStatusBadge };
export type { LeadStatusBadgeProps };
