import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormActionsProps = {
  children: ReactNode;
  className?: string;
};

function FormActions({ children, className }: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { FormActions };
export type { FormActionsProps };
