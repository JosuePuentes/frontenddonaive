import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  badge?: string;
  className?: string;
};

function StatCard({ label, value, hint, badge, className }: StatCardProps) {
  return (
    <Card variant="elevated" className={cn("h-full", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-caption font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </p>
        {badge ? <Badge variant="muted">{badge}</Badge> : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-body-small text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}

export { StatCard };
export type { StatCardProps };
