import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("text-foreground", {
  variants: {
    variant: {
      display: "text-display",
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
    },
  },
  defaultVariants: {
    variant: "h1",
  },
});

const defaultTags = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
} as const;

type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  };

function Heading({
  className,
  variant = "h1",
  as,
  ...props
}: HeadingProps) {
  const resolvedVariant = variant ?? "h1";
  const Comp = as ?? defaultTags[resolvedVariant];

  return (
    <Comp
      data-slot="heading"
      className={cn(headingVariants({ variant: resolvedVariant }), className)}
      {...props}
    />
  );
}

export { Heading, headingVariants };
export type { HeadingProps };
