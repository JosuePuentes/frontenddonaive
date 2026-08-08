import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProposalHeader } from "@/modules/private/crm/components/proposals/ProposalHeader";
import { ProposalSummary } from "@/modules/private/crm/components/proposals/ProposalSummary";
import { ProposalItemList } from "@/modules/private/crm/components/proposals/ProposalItemList";
import { ProposalPricing } from "@/modules/private/crm/components/proposals/ProposalPricing";
import { ProposalActions } from "@/modules/private/crm/components/proposals/ProposalActions";
import type { Proposal } from "@/types/proposal";

type ProposalViewProps = {
  proposal: Proposal;
};

function ProposalView({ proposal }: ProposalViewProps) {
  return (
    <div className="space-y-6">
      <ProposalHeader
        proposal={proposal}
        actions={<ProposalActions disabled />}
      />

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Información y comprensión</h3>
        <ProposalSummary proposal={proposal} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold">Servicios y alcance</h3>
          <Badge variant="outline">Combinables</Badge>
        </div>
        <ProposalItemList items={proposal.items} currency={proposal.currency} />
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Entregables</h3>
        <Card variant="outline" className="space-y-2">
          {proposal.deliverables && proposal.deliverables.length > 0 ? (
            <ul className="list-inside list-disc space-y-1 text-body-small text-muted-foreground">
              {proposal.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-body-small text-muted-foreground">
              Los entregables se listarán aquí.
            </p>
          )}
        </Card>
      </section>

      <ProposalPricing proposal={proposal} />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card variant="outline" className="space-y-2">
          <h3 className="text-base font-semibold">Condiciones</h3>
          <p className="text-body-small text-muted-foreground">
            {proposal.conditions ?? "Condiciones por definir."}
          </p>
        </Card>
        <Card variant="outline" className="space-y-2">
          <h3 className="text-base font-semibold">Notas y estado</h3>
          <p className="text-body-small text-muted-foreground">
            {proposal.notes ?? "Sin notas."}
          </p>
        </Card>
      </section>
    </div>
  );
}

export { ProposalView };
export type { ProposalViewProps };
