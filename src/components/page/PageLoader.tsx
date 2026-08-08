import { cn } from "@/lib/utils";

type PageLoaderProps = {
  className?: string;
  label?: string;
};

function PageLoader({
  className,
  label = "Cargando página…",
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-1 flex-col items-center justify-center gap-4 px-6 py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="size-9 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-body-small text-muted-foreground">{label}</p>
    </div>
  );
}

export { PageLoader };
export type { PageLoaderProps };
