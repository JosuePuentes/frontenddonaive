import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerVariants = cva(
  "mx-auto w-full px-[var(--page-padding-x)]",
  {
    variants: {
      variant: {
        default: "max-w-[var(--container-max)]",
        narrow: "max-w-[var(--container-narrow)]",
        wide: "max-w-[var(--container-wide)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type ContainerProps = React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants>;

function Container({ className, variant, ...props }: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(containerVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Container, containerVariants };
export type { ContainerProps };
