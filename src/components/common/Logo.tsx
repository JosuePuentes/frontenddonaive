import { Link } from "react-router";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  to?: string;
};

function Logo({
  className,
  markClassName,
  showWordmark = true,
  to = "/",
}: LogoProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2.5 text-foreground no-underline outline-none transition-opacity duration-[var(--duration-fast)] hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-[var(--radius-sm)]",
        className,
      )}
      aria-label="Donaive"
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-primary text-primary-foreground shadow-sm",
          markClassName,
        )}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none">
          <path
            d="M5 16.5 12 5l7 11.5H5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M8.2 16.5h7.6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="font-[family-name:var(--font-family-display)] text-base font-semibold tracking-tight">
          Donaive
        </span>
      ) : null}
    </Link>
  );
}

export { Logo };
export type { LogoProps };
