import { cn } from "@/lib/utils";
import { DIAGNOSIS_METHODOLOGY_STAGES } from "@/types/diagnosis";

type DiagnosisProgressProps = {
  /** Índice 0-based de la etapa activa (metodología Donaive). */
  activeStage?: number;
  className?: string;
};

function DiagnosisProgress({
  activeStage = 0,
  className,
}: DiagnosisProgressProps) {
  return (
    <ol
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-1",
        className,
      )}
      aria-label="Metodología Donaive"
    >
      {DIAGNOSIS_METHODOLOGY_STAGES.map((stage, index) => {
        const isActive = index === activeStage;
        const isDone = index < activeStage;
        return (
          <li key={stage} className="flex items-center gap-1 sm:gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-1 text-caption font-medium",
                isActive && "bg-primary text-primary-foreground",
                isDone && !isActive && "bg-primary/15 text-primary",
                !isActive &&
                  !isDone &&
                  "bg-surface-muted text-muted-foreground",
              )}
            >
              {stage}
            </span>
            {index < DIAGNOSIS_METHODOLOGY_STAGES.length - 1 ? (
              <span
                className="hidden text-muted-foreground sm:inline"
                aria-hidden="true"
              >
                →
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export { DiagnosisProgress };
export type { DiagnosisProgressProps };
