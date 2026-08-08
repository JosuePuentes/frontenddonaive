import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/page/EmptyState";
import type { ProposalItem } from "@/types/proposal";

type ProposalItemListProps = {
  items: ProposalItem[];
  currency?: string;
};

function formatAmount(value?: number | null, currency?: string) {
  if (value == null) return "No definido";
  return `${currency ?? ""} ${value}`.trim();
}

function ProposalItemList({ items, currency }: ProposalItemListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin servicios en la propuesta"
        description="Combine servicios del catálogo para construir el alcance."
      />
    );
  }

  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card variant="outline" className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">
                {item.name}
              </h4>
              <Badge variant="muted">Cant. {item.quantity}</Badge>
            </div>
            {item.description ? (
              <p className="text-body-small text-muted-foreground">
                {item.description}
              </p>
            ) : null}
            <div className="grid gap-1 text-caption text-muted-foreground sm:grid-cols-3">
              <p>Unitario: {formatAmount(item.unitPrice, currency)}</p>
              <p>Descuento: {formatAmount(item.discount, currency)}</p>
              <p>Total línea: {formatAmount(item.total, currency)}</p>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export { ProposalItemList };
export type { ProposalItemListProps };
