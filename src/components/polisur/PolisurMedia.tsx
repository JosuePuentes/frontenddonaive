import { useState } from "react";
import { cn } from "@/lib/utils";

type PolisurMediaProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  objectPosition?: string;
  overlay?: "none" | "soft" | "strong";
};

/**
 * Marco fotográfico institucional.
 * Si la imagen no existe aún, muestra un fondo neutro sin texto técnico.
 */
function PolisurMedia({
  src,
  alt,
  className,
  imgClassName,
  objectPosition = "center",
  overlay = "none",
}: PolisurMediaProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("ps-media-frame", className)}>
      {!failed ? (
        <img
          src={src}
          alt={alt}
          className={imgClassName}
          style={{ objectPosition }}
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : null}

      {overlay === "soft" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(6,13,22,0.72)] via-[rgba(6,13,22,0.2)] to-transparent"
        />
      ) : null}

      {overlay === "strong" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,13,22,0.45)_0%,rgba(6,13,22,0.55)_40%,rgba(6,13,22,0.78)_100%)]"
        />
      ) : null}
    </div>
  );
}

export { PolisurMedia };
export type { PolisurMediaProps };
