import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";

type NavbarProps = {
  className?: string;
};

function Navbar({ className }: NavbarProps) {
  return (
    <header
      data-slot="navbar"
      className={cn(
        "sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-sm",
        className,
      )}
    >
      <Container className="flex h-14 items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-2">
          {/* Navigation links will be added in a later prompt */}
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}

export { Navbar };
export type { NavbarProps };
