import { useEffect, useState } from "react";
import { Link } from "react-router";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA, polisurCopy } from "@/content/polisur";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";
import { polisurBannerTypography } from "@/lib/polisur-banner-typography";
import { cn } from "@/lib/utils";

function scrollToInstitucion(event: React.MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById("institucion");
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", POLISUR_ROUTES.institucion);
}

function PolisurHero() {
  const { site } = usePolisurSite();
  const banner = site.banner;
  const type = polisurBannerTypography(banner);
  const [photoMissing, setPhotoMissing] = useState(false);
  const imageSrc = banner.imageUrl || POLISUR_MEDIA.home.hero;
  const imageWithCache = imageSrc;

  useEffect(() => {
    setPhotoMissing(false);
  }, [imageSrc]);

  return (
    <section
      className={cn("ps-hero", photoMissing && "ps-hero--institutional")}
      aria-labelledby="polisur-hero-title"
    >
      <PolisurMedia
        src={imageWithCache}
        alt="Imagen institucional de POLISUR"
        className="ps-hero__media"
        objectPosition="center 28%"
        overlay={photoMissing ? "none" : "readable"}
        priority
        onImageError={() => setPhotoMissing(true)}
      />

      <div className="ps-hero__content">
        <div className="ps-container w-full">
          <div className={cn("ps-hero__panel", type.panel)}>
            <p
              className={cn(
                "ps-eyebrow text-[var(--ps-mint)]",
                type.subtitle,
              )}
            >
              {banner.subtitle || polisurCopy.hero.subtitle}
            </p>
            <h1
              id="polisur-hero-title"
              className={cn(
                "ps-display mt-3 text-[var(--ps-white)]",
                type.title,
              )}
            >
              {banner.title || polisurCopy.hero.title}
            </h1>
            <p
              className={cn(
                "mt-5 whitespace-pre-line text-[var(--ps-paper)]/92",
                type.message,
              )}
            >
              {banner.message || polisurCopy.hero.message}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={POLISUR_ROUTES.institucion}
                onClick={scrollToInstitucion}
                className="ps-btn ps-btn-primary"
              >
                {banner.ctaPrimary || polisurCopy.hero.ctaPrimary}
              </Link>
              <Link
                to={POLISUR_ROUTES.preinscripcion}
                className="ps-btn ps-btn-ghost"
              >
                {banner.ctaSecondary || polisurCopy.hero.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { PolisurHero };
