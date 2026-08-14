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
  if (failed) return null;

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
