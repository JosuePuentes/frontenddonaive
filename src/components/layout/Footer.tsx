import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/common/Logo";
import { cn } from "@/lib/utils";

type FooterProps = {
  className?: string;
};

function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      data-slot="footer"
      className={cn("border-t border-border bg-surface-muted", className)}
    >
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p className="text-caption text-muted-foreground">
          © {year} Donaive. Todos los derechos reservados.
        </p>
      </Container>
    </footer>
  );
}

export { Footer };
export type { FooterProps };
