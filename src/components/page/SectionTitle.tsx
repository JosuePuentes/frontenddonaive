import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/utils";

type SectionTitleProps = {
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
};

function SectionTitle({
  title,
  description,
  className,
  align = "left",
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <Heading variant="h2" className="text-balance">
        {title}
      </Heading>
      {description ? (
        <p className="mt-4 text-pretty text-body text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export { SectionTitle };
export type { SectionTitleProps };
