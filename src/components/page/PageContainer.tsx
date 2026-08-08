import type { ReactNode } from "react";
import { Container, type ContainerProps } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
  variant?: ContainerProps["variant"];
};

function PageContainer({
  children,
  className,
  variant = "default",
}: PageContainerProps) {
  return (
    <Container
      variant={variant}
      className={cn("py-[var(--section-padding-y-sm)] pb-[var(--section-padding-y)]", className)}
    >
      {children}
    </Container>
  );
}

export { PageContainer };
export type { PageContainerProps };
