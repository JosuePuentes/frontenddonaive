import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Container, type ContainerProps } from "@/components/ui/Container";

const sectionVariants = cva("w-full", {
  variants: {
    spacing: {
      none: "py-0",
      sm: "py-[var(--section-padding-y-sm)]",
      default: "py-[var(--section-padding-y)]",
      lg: "py-[var(--section-padding-y-lg)]",
    },
    background: {
      default: "bg-background",
      surface: "bg-surface",
      muted: "bg-surface-muted",
      transparent: "bg-transparent",
    },
  },
  defaultVariants: {
    spacing: "default",
    background: "default",
  },
});

type SectionProps = React.ComponentProps<"section"> &
  VariantProps<typeof sectionVariants> & {
    containerVariant?: ContainerProps["variant"];
    contained?: boolean;
  };

function Section({
  className,
  spacing,
  background,
  containerVariant = "default",
  contained = true,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ spacing, background }), className)}
      {...props}
    >
      {contained ? (
        <Container variant={containerVariant}>{children}</Container>
      ) : (
        children
      )}
    </section>
  );
}

export { Section, sectionVariants };
export type { SectionProps };
