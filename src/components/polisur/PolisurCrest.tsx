import { useState } from "react";
import { cn } from "@/lib/utils";
import { POLISUR_MEDIA } from "@/content/polisur";

type PolisurCrestProps = {
  className?: string;
  imgClassName?: string;
  /** Tamaño del marco de reserva si el escudo aún no está. */
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClass = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-16 w-16",
  xl: "h-24 w-24 sm:h-28 sm:w-28",
} as const;

/**
 * Escudo oficial. Si el archivo no existe, reserva neutra sin texto técnico.
 */
function PolisurCrest({
  className,
  imgClassName,
  size = "md",
}: PolisurCrestProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center bg-transparent",
        sizeClass[size],
        className,
      )}
    >
      {!failed ? (
        <img
          src={POLISUR_MEDIA.logo}
          alt="Escudo POLISUR"
          className={cn("h-full w-full bg-transparent object-contain", imgClassName)}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden
          className="h-[70%] w-[70%] rounded-[2px] border border-[var(--ps-line-strong)] bg-transparent"
        />
      )}
    </span>
  );
}

export { PolisurCrest };
