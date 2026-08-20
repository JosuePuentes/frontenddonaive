import { useState } from "react";
import { Link } from "react-router";
import { PolisurMedia } from "@/components/polisur/PolisurMedia";
import { POLISUR_ROUTES } from "@/constants/polisur-routes";
import { POLISUR_MEDIA } from "@/content/polisur";
import { usePolisurSite } from "@/providers/polisur/PolisurSiteProvider";
import { cn } from "@/lib/utils";

function PolisurHero() {
  const { site } = usePolisurSite();
  const banner = site.banner;
  const [photoMissing, setPhotoMissing] = useState(false);
  const imageSrc = banner.imageUrl || POLISUR_MEDIA.home.hero;

  return (
    <section
      className={cn("ps-hero", photoMissing && "ps-hero--institutional")}
      aria-labelledby="polisur-hero-title"
    >
      <PolisurMedia
        src={imageSrc}
        alt="Imagen institucional de POLISUR"
        className="ps-hero__media"
        objectPosition="center 28%"
        overlay={photoMissing ? "none" : "readable"}
        priority
        onImageError={() => setPhotoMissing(true)}
      />

      <div className="ps-hero__content">
        <div className="ps-container w-full">
          <div className="ps-hero__panel">
            <p className="ps-eyebrow text-[var(--ps-mint)]">
              {banner.subtitle}
            </p>
            <h1
              id="polisur-hero-title"
              className="ps-display mt-3 text-[2.85rem] leading-[1.02] text-[var(--ps-white)] sm:text-6xl lg:text-7xl"
            >
              {banner.title}
            </h1>
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-[var(--ps-paper)]/92 sm:text-base">
              {banner.message}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={POLISUR_ROUTES.institucion}
                className="ps-btn ps-btn-primary"
              >
                {banner.ctaPrimary}
              </Link>
              <Link
                to={POLISUR_ROUTES.preinscripcion}
                className="ps-btn ps-btn-ghost"
              >
                {banner.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { PolisurHero };
