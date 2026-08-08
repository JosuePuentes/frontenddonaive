import { Link } from "react-router";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/common/Logo";
import { footerNav } from "@/constants/navigation";
import { cn } from "@/lib/utils";

type FooterProps = {
  className?: string;
};

const footerSections = [
  { title: "Producto", items: footerNav.producto },
  { title: "Empresa", items: footerNav.empresa },
  { title: "Recursos", items: footerNav.recursos },
  { title: "Legal", items: footerNav.legal },
] as const;

function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      data-slot="footer"
      className={cn("border-t border-border bg-surface-muted", className)}
    >
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-sm text-body-small text-muted-foreground">
              Diseñamos sistemas que ayudan a las organizaciones a funcionar
              mejor.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-3">
              <h2 className="text-caption font-semibold uppercase tracking-[0.08em] text-foreground">
                {section.title}
              </h2>
              <ul className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-body-small text-muted-foreground outline-none transition-colors duration-[var(--duration-fast)] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[var(--radius-sm)]"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-caption text-muted-foreground">
            © {year} Donaive
          </p>
        </div>
      </Container>
    </footer>
  );
}

export { Footer };
export type { FooterProps };
