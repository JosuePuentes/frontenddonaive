import { useEffect, useState } from "react";
import { polisurAssetUrl } from "@/lib/polisur-asset-url";
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
  onImageError?: () => void;
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
  onImageError,
}: PolisurMediaProps) {
  const [failed, setFailed] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(() => polisurAssetUrl(src));

  useEffect(() => {
    setResolvedSrc(polisurAssetUrl(src));
    setFailed(false);
  }, [src]);

  useEffect(() => {
    function onAssetUpdated() {
      setResolvedSrc(polisurAssetUrl(src));
      setFailed(false);
    }
    window.addEventListener("polisur-asset-updated", onAssetUpdated);
    return () =>
      window.removeEventListener("polisur-asset-updated", onAssetUpdated);
  }, [src]);

  const handleError = () => {
    setFailed(true);
    onImageError?.();
  };

  return (
    <div className={cn("ps-media-frame", className)}>
      {!failed ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className={cn(
            fit === "contain" ? "object-contain" : "object-cover",
            imgClassName,
          )}
          style={{ objectPosition }}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      ) : null}

      {overlay === "soft" ? <div aria-hidden className="ps-overlay-soft" /> : null}

      {overlay === "readable" ? (
        <div aria-hidden className="ps-overlay-readable" />
      ) : null}

      {overlay === "strong" ? (
        <div aria-hidden className="ps-overlay-strong" />
      ) : null}
    </div>
  );
}

export { PolisurMedia };
export type { PolisurMediaProps };
