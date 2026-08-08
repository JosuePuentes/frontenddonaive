import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  className?: string;
};

function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <Card
      variant="outline"
      className={cn(
        "border-dashed bg-surface-muted/40 px-6 py-10 text-center",
        className,
      )}
    >
      <h2 className="text-h3">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-body-small text-muted-foreground">
        {description}
      </p>
    </Card>
  );
}

export { EmptyState };
export type { EmptyStateProps };
