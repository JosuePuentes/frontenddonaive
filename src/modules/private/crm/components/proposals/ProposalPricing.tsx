import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Proposal } from "@/types/proposal";

type ProposalPricingProps = {
  proposal: Proposal;
};

function formatAmount(value?: number | null, currency?: string) {
  if (value == null) return "No definido";
  return `${currency ?? ""} ${value}`.trim();
}

function ProposalPricing({ proposal }: ProposalPricingProps) {
  return (
    <Card variant="default" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold">Inversión</h3>
        <Badge variant="muted">Sin cálculo fiscal real</Badge>
        {proposal.isDemo ? <Badge variant="outline">DEMO</Badge> : null}
      </div>
      <p className="text-body-small text-muted-foreground">
        La inversión se muestra después del valor y el alcance. Los montos
        quedan preparados para cálculo futuro — no se inventan precios.
      </p>
      <dl className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <dt className="text-caption text-muted-foreground">Subtotal</dt>
          <dd className="text-sm font-medium">
            {formatAmount(proposal.subtotal, proposal.currency)}
          </dd>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <dt className="text-caption text-muted-foreground">Descuento</dt>
          <dd className="text-sm font-medium">
            {formatAmount(proposal.discount, proposal.currency)}
          </dd>
        </div>
        <div className="rounded-[var(--radius-md)] border border-border px-3 py-2">
          <dt className="text-caption text-muted-foreground">Impuesto</dt>
          <dd className="text-sm font-medium">
            {formatAmount(proposal.tax, proposal.currency)}
          </dd>
        </div>
        <div className="rounded-[var(--radius-md)] border border-primary/30 bg-primary/5 px-3 py-2">
          <dt className="text-caption text-muted-foreground">Total</dt>
          <dd className="text-sm font-semibold text-foreground">
            {formatAmount(proposal.total, proposal.currency)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}

export { ProposalPricing };
export type { ProposalPricingProps };
