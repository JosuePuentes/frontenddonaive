import { useState } from "react";
import { cn } from "@/lib/utils";

type PolisurMarkProps = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Marca institucional. Si el archivo no existe, no se muestra nada.
 * No altera el contenido del logo.
 */
function PolisurMark({ src, alt, className }: PolisurMarkProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-label={alt}
        className={cn(
          "inline-flex items-center justify-center border border-[var(--ps-line-strong)] bg-[var(--ps-navy-800)]/60",
          className,
        )}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}

export { PolisurMark };
