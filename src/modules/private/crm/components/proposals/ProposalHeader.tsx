import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProposalStatusBadge } from "@/modules/private/crm/components/proposals/ProposalStatusBadge";
import type { Proposal } from "@/types/proposal";

type ProposalHeaderProps = {
  proposal: Proposal;
  actions?: ReactNode;
};

function ProposalHeader({ proposal, actions }: ProposalHeaderProps) {
  return (
    <Card variant="default" className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {proposal.isDemo ? <Badge variant="muted">DEMO</Badge> : null}
            <ProposalStatusBadge status={proposal.status} />
            {proposal.validUntil ? (
              <Badge variant="outline">Vigencia: {proposal.validUntil}</Badge>
            ) : null}
          </div>
          <h2 className="text-h3 break-words">{proposal.title}</h2>
          {proposal.summary ? (
            <p className="max-w-3xl text-body-small text-muted-foreground">
              {proposal.summary}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>

      <div className="grid gap-2 text-caption text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
        <p>
          Cliente:{" "}
          <span className="text-foreground">
            {proposal.organizationName ?? proposal.organizationId ?? "—"}
          </span>
        </p>
        <p>
          Oportunidad:{" "}
          <span className="text-foreground">
            {proposal.opportunityId ?? "—"}
          </span>
        </p>
        <p>
          Diagnóstico:{" "}
          <span className="text-foreground">
            {proposal.diagnosisId ?? "—"}
          </span>
        </p>
        <p>
          Moneda:{" "}
          <span className="text-foreground">{proposal.currency ?? "—"}</span>
        </p>
      </div>
    </Card>
  );
}

export { ProposalHeader };
export type { ProposalHeaderProps };
