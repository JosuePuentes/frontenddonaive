import { Link } from "react-router";
import { useEffect } from "react";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { applySiteDesignToDom } from "@/lib/ad-licoreria/site-design";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

export default function AdLicoreriaHome() {
  const { siteDesign } = useAdLicoreria();

  useEffect(() => {
    applySiteDesignToDom(siteDesign);
  }, [siteDesign]);

  const banners = [...siteDesign.banners]
    .filter((b) => b.active)
    .sort((a, b) => a.order - b.order);

  const bgStyle = siteDesign.homeBackgroundUrl
    ? {
        backgroundImage: `linear-gradient(${siteDesign.homeBackgroundOverlay}, ${siteDesign.homeBackgroundOverlay}), url(${siteDesign.homeBackgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div className="ad-landing" style={bgStyle}>
      <div className="ad-landing__card">
        <div className="mb-6 flex justify-center">
          <AdLicoreriaBrandMark size="lg" showText={false} />
        </div>
        <p className="ad-eyebrow">{siteDesign.homeHeroEyebrow}</p>
        <h1 className="ad-landing__title">{siteDesign.brandName}</h1>
        <p className="ad-landing__tag">{siteDesign.brandTagline}</p>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--ad-muted)]">
          {siteDesign.brandDescription}
        </p>
        <div className="ad-landing__actions">
          <Link to={AD_LICORERIA_ROUTES.inicio} className="ad-btn ad-btn--gold">
            {siteDesign.homePrimaryCta}
          </Link>
          <Link
            to={AD_LICORERIA_ROUTES.ventas}
            className="ad-btn ad-btn--primary"
          >
            {siteDesign.homeSecondaryCta}
          </Link>
          <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn">
            {siteDesign.homeTertiaryCta}
          </Link>
        </div>
      </div>

      {banners.length ? (
        <div className="ad-landing__banners">
          {banners.map((b) => (
            <article
              key={b.id}
              className="ad-landing__banner"
              style={
                b.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(rgba(10,11,15,.55), rgba(10,11,15,.7)), url(${b.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <p className="ad-eyebrow">Publicidad</p>
              <h2 className="ad-display text-2xl text-[var(--ad-gold-soft)]">
                {b.title}
              </h2>
              {b.subtitle ? (
                <p className="mt-1 text-sm text-[var(--ad-muted)]">
                  {b.subtitle}
                </p>
              ) : null}
              {b.ctaLabel && b.ctaHref ? (
                <Link className="ad-btn ad-btn--gold mt-3 inline-flex" to={b.ctaHref}>
                  {b.ctaLabel}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
