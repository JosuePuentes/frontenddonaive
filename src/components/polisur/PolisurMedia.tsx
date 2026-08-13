import { useState } from "react";
import { cn } from "@/lib/utils";

type PolisurMediaProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  objectPosition?: string;
  /** cover: foto de escena; contain: PNG/escudos sin recortar sujetos */
  fit?: "cover" | "contain";
  overlay?: "none" | "soft" | "readable" | "strong";
  priority?: boolean;
};

/**
 * Marco fotográfico institucional.
 * Si la imagen no existe aún, muestra un fondo neutro sin texto técnico.
 * No aplica filtros de color sobre rostros ni uniformes.
 */
function PolisurMedia({
  src,
  alt,
  className,
  imgClassName,
  objectPosition = "center",
  fit = "cover",
  overlay = "none",
  priority = false,
}: PolisurMediaProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("ps-media-frame", className)}>
      {!failed ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            fit === "contain" ? "object-contain" : "object-cover",
            imgClassName,
          )}
          style={{ objectPosition }}
          onError={() => setFailed(true)}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      ) : null}

      {overlay === "soft" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(6,13,22,0.55)] via-transparent to-transparent"
        />
      ) : null}

      {overlay === "readable" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(6,13,22,0.78)_0%,rgba(6,13,22,0.42)_42%,rgba(6,13,22,0.18)_68%,rgba(6,13,22,0.35)_100%)]"
        />
      ) : null}

      {overlay === "strong" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,13,22,0.4)_0%,rgba(6,13,22,0.5)_45%,rgba(6,13,22,0.72)_100%)]"
        />
      ) : null}
    </div>
  );
}

export { PolisurMedia };
export type { PolisurMediaProps };
