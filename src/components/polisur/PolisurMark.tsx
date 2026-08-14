import { useState } from "react";
import { cn } from "@/lib/utils";

type PolisurMarkProps = {
  src: string;
  alt: string;
  className?: string;
};

/**
 * Marca institucional sobre fondo transparente.
 * No altera el contenido del logo.
 */
function PolisurMark({ src, alt, className }: PolisurMarkProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-label={alt}
        className={cn("inline-flex bg-transparent", className)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("bg-transparent object-contain", className)}
      onError={() => setFailed(true)}
    />
  );
}

export { PolisurMark };
