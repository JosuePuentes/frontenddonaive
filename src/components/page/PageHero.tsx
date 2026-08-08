import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { PageContainer } from "@/components/page/PageContainer";
import { cn } from "@/lib/utils";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
};

function PageHero({ eyebrow, title, description, className }: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border/60",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgb(37_99_255/0.1),transparent_45%)]" />
      <PageContainer className="relative py-14 sm:py-16">
        <div className="max-w-3xl">
          {eyebrow ? (
            <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5">
              {eyebrow}
            </Badge>
          ) : null}
          <Heading variant="h1" className="text-balance">
            {title}
          </Heading>
          <p className="mt-4 max-w-2xl text-pretty text-body text-muted-foreground">
            {description}
          </p>
        </div>
      </PageContainer>
    </section>
  );
}

export { PageHero };
export type { PageHeroProps };
