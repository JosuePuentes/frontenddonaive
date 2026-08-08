import { CRM_PIPELINE_COLUMNS, type Opportunity } from "@/types/crm";
import { OpportunityCard } from "@/modules/private/crm/components/OpportunityCard";
import { cn } from "@/lib/utils";

type PipelineBoardProps = {
  opportunities?: Opportunity[];
  className?: string;
};

function PipelineBoard({
  opportunities = [],
  className,
}: PipelineBoardProps) {
  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 2xl:grid-cols-8 xl:overflow-visible",
        className,
      )}
    >
      {CRM_PIPELINE_COLUMNS.map((column) => {
        const items = opportunities.filter(
          (item) => item.status === column.status,
        );

        return (
          <section
            key={column.status}
            className="min-w-[220px] shrink-0 rounded-[var(--radius-lg)] border border-border bg-surface-muted/40 p-3 xl:min-w-0"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {column.label}
              </h2>
              <span className="text-caption text-muted-foreground">
                {items.length}
              </span>
            </div>

            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-border bg-background/70 px-3 py-6 text-center text-caption text-muted-foreground">
                  Sin oportunidades
                </div>
              ) : (
                items.map((item) => (
                  <OpportunityCard key={item.id} opportunity={item} />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export { PipelineBoard };
export type { PipelineBoardProps };
