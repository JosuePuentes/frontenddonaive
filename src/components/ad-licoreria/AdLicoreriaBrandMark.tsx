import { useState } from "react";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import { AD_LICORERIA_MEDIA, adLicoreriaBrand } from "@/content/ad-licoreria/brand";

type AdLicoreriaBrandMarkProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
};

const sizeMap = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-16 w-16",
} as const;

/**
 * Marca A&D. Prioriza logo del diseño admin (siteDesign).
 */
function AdLicoreriaBrandMark({
  size = "md",
  showText = true,
}: AdLicoreriaBrandMarkProps) {
  const [failed, setFailed] = useState(false);
  const { siteDesign } = useAdLicoreria();
  const logo = siteDesign.logoUrl || AD_LICORERIA_MEDIA.logo;
  const name = siteDesign.brandName || adLicoreriaBrand.name;
  const tagline = siteDesign.brandTagline || adLicoreriaBrand.tagline;

  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-[var(--ad-line-strong)] bg-black/30 ${sizeMap[size]}`}
      >
        {!failed ? (
          <img
            src={logo}
            alt={`${name} logo`}
            className="h-full w-full object-contain p-1"
            onError={() => setFailed(true)}
          />
        ) : (
          <span
            className="ad-display text-[var(--ad-gold-soft)]"
            style={{ fontSize: size === "lg" ? "1.4rem" : "1rem" }}
            aria-hidden
          >
            A&D
          </span>
        )}
      </span>
      {showText ? (
        <span className="min-w-0 leading-tight">
          <span className="ad-display block truncate text-xl text-[var(--ad-gold-soft)]">
            {name}
          </span>
          <span className="block truncate text-[0.62rem] uppercase tracking-[0.18em] text-[var(--ad-muted)]">
            {tagline}
          </span>
        </span>
      ) : null}
    </span>
  );
}

export { AdLicoreriaBrandMark };
