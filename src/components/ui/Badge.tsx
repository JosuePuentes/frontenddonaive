import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-sm)] px-2.5 py-0.5 font-[family-name:var(--font-body)] text-caption transition-[background-color,color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]",
  {
    variants: {
      variant: {
        default: "bg-surface-muted text-foreground",
        electric: "bg-primary text-primary-foreground",
        royal: "bg-secondary text-secondary-foreground",
        outline: "border border-border bg-transparent text-foreground",
        muted: "bg-surface-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
