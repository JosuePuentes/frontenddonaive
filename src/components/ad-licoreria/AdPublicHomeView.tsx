import { Link } from "react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { adDesignRepository } from "@/services/ad-licoreria/design/repository";
import { applySiteDesignToDom } from "@/services/ad-licoreria/design/apply";
import type { AdSiteDesign } from "@/types/ad-licoreria-design";
import type { AdCategory, AdPresentation, AdProduct } from "@/types/ad-licoreria";

const POPUP_SESSION_KEY = "ad-licoreria-popup-seen";

type Props = {
  design: AdSiteDesign;
  products?: AdProduct[];
  presentations?: AdPresentation[];
  categories?: AdCategory[];
  /** Marca la vista como preview (banner info). */
  previewMode?: boolean;
  /** CTA de sesión (Iniciar sesión / Entrar al sistema). */
  authAction?: ReactNode;
};

function alignClass(align: string) {
  if (align === "left") return "items-start text-left";
  if (align === "right") return "items-end text-right";
  return "items-center text-center";
}

/**
 * Home / preview renderizado 100% desde configuración de diseño.
 */
export function AdPublicHomeView({
  design,
  products = [],
  presentations = [],
  categories = [],
  previewMode = false,
  authAction,
}: Props) {
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    applySiteDesignToDom(design);
  }, [design]);

  useEffect(() => {
    const p = design.popup;
    if (!p?.enabled) return;
    const now = new Date();
    if (p.startsAt && new Date(p.startsAt) > now) return;
    if (p.endsAt && new Date(p.endsAt) < now) return;
    if (p.oncePerSession && typeof sessionStorage !== "undefined") {
      if (sessionStorage.getItem(POPUP_SESSION_KEY) === "1") return;
    }
    setPopupOpen(true);
  }, [design.popup]);

  const sections = useMemo(
    () => adDesignRepository.sortedSections(design),
    [design],
  );
  const banners = useMemo(
    () => adDesignRepository.liveBanners(design),
    [design],
  );
  const gallery = useMemo(
    () => adDesignRepository.liveGallery(design),
    [design],
  );

  const featured = useMemo(() => {
    const cfg = design.featuredProducts;
    if (!cfg.enabled) return [];
    let list = products.filter((p) => p.active);
    if (cfg.productIds.length) {
      list = cfg.productIds
        .map((id) => list.find((p) => p.id === id))
        .filter(Boolean) as AdProduct[];
    }
    return list.slice(0, Math.max(1, cfg.count));
  }, [design.featuredProducts, products]);

  function priceFor(productId: string) {
    const pres = presentations.find(
      (p) => p.productId === productId && p.active,
    );
    return pres?.price;
  }

  function closePopup() {
    setPopupOpen(false);
    if (design.popup.oncePerSession && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(POPUP_SESSION_KEY, "1");
    }
  }

  const hero = design.hero;
  const brand = design.brand;

  return (
    <div
      className="ad-public-home"
      style={{
        background: design.colors.bg,
        color: design.colors.text,
        fontFamily: design.typography.bodyFont,
        fontSize: `${100 * (design.typography.scale || 1)}%`,
      }}
    >
      {previewMode ? (
        <div className="ad-public-home__preview-bar">
          VISTA PREVIA · borrador (no publicado)
        </div>
      ) : null}

      {authAction ? (
        <div className="ad-public-home__auth-bar">
          <AdLicoreriaBrandMark size="sm" showText />
          <div className="ad-public-home__auth-actions">{authAction}</div>
        </div>
      ) : null}

      {sections.map((sec) => {
        if (!sec.visible) return null;

        if (sec.id === "hero") {
          const bg =
            hero.backgroundUrl ||
            (hero.videoUrl
              ? undefined
              : design.homeBackgroundUrl || undefined);
          return (
            <section
              key={sec.id}
              className={`ad-public-hero ${alignClass(hero.align)}`}
              style={{
                backgroundImage: bg
                  ? `linear-gradient(${hero.overlay}, ${hero.overlay}), url(${bg})`
                  : `linear-gradient(${hero.overlay}, ${hero.overlay})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {hero.videoUrl ? (
                <video
                  className="ad-public-hero__video"
                  src={hero.videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : null}
              <div className="ad-public-hero__inner">
                <div className="mb-4">
                  <AdLicoreriaBrandMark size="lg" showText={false} />
                </div>
                <p className="ad-eyebrow">{hero.subtitle}</p>
                <h1
                  className="ad-public-hero__title"
                  style={{
                    fontFamily: design.typography.headingFont,
                    fontWeight: design.typography.headingWeight,
                    color: design.colors.primary || design.colors.gold,
                  }}
                >
                  {hero.title || brand.commercialName}
                </h1>
                <p className="ad-public-hero__desc">{hero.description}</p>
                <div className="ad-public-hero__actions">
                  {hero.primaryVisible ? (
                    <Link
                      to={hero.primaryHref || "/licoreria/inicio"}
                      className="ad-btn ad-btn--gold"
                    >
                      {hero.primaryLabel}
                    </Link>
                  ) : null}
                  {hero.secondaryVisible ? (
                    <Link
                      to={hero.secondaryHref || "/licoreria/ventas"}
                      className="ad-btn ad-btn--primary"
                    >
                      {hero.secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          );
        }

        if (sec.id === "about") {
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                Nosotros
              </h2>
              <p className="ad-public-muted">{brand.description}</p>
              <p className="ad-public-muted mt-2">{brand.shortName}</p>
            </section>
          );
        }

        if (sec.id === "featured" && design.featuredProducts.enabled) {
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                {design.featuredProducts.title}
              </h2>
              <p className="ad-public-muted">
                {design.featuredProducts.subtitle}
              </p>
              <div className="ad-public-grid">
                {featured.map((p) => {
                  const price = priceFor(p.id);
                  return (
                    <article key={p.id} className="ad-public-card">
                      {design.featuredProducts.showImage ? (
                        <div
                          className="ad-public-card__img"
                          style={{
                            background: design.colors.card || design.colors.panel,
                          }}
                        />
                      ) : null}
                      <h3>{p.name}</h3>
                      <p className="ad-public-muted text-sm">{p.brand}</p>
                      {design.featuredProducts.showPrice && price ? (
                        <p className="mt-1 text-[var(--ad-gold-soft)]">
                          ${price.usd.toFixed(2)}
                        </p>
                      ) : null}
                      {design.featuredProducts.showButton ? (
                        <Link
                          className="ad-btn mt-2 inline-flex"
                          to={design.featuredProducts.linkHref}
                        >
                          {design.featuredProducts.buttonLabel}
                        </Link>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        }

        if (sec.id === "categories") {
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                Categorías
              </h2>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.active)
                  .map((c) => (
                    <span key={c.id} className="ad-btn">
                      {c.name}
                    </span>
                  ))}
              </div>
            </section>
          );
        }

        if (sec.id === "promotions" || sec.id === "banners") {
          if (!banners.length) return null;
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                {sec.id === "promotions" ? "Promociones" : "Banners"}
              </h2>
              <div className="ad-public-banners">
                {banners.map((b) => (
                  <article
                    key={b.id}
                    className="ad-public-banner"
                    style={{
                      backgroundImage: b.imageUrl
                        ? `linear-gradient(rgba(10,11,15,.55), rgba(10,11,15,.7)), url(${b.imageUrl})`
                        : undefined,
                    }}
                    data-mobile-bg={b.imageUrlMobile || undefined}
                  >
                    {b.imageUrlMobile ? (
                      <style>{`
                        @media (max-width: 768px) {
                          [data-mobile-bg="${b.imageUrlMobile}"] {
                            background-image: linear-gradient(rgba(10,11,15,.55), rgba(10,11,15,.7)), url(${b.imageUrlMobile}) !important;
                          }
                        }
                      `}</style>
                    ) : null}
                    <h3>{b.title}</h3>
                    {b.subtitle ? (
                      <p className="ad-public-muted">{b.subtitle}</p>
                    ) : null}
                    {b.ctaLabel && b.ctaHref ? (
                      <Link className="ad-btn ad-btn--gold mt-2 inline-flex" to={b.ctaHref}>
                        {b.ctaLabel}
                      </Link>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          );
        }

        if (sec.id === "gallery") {
          if (!gallery.length) return null;
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                Galería
              </h2>
              <div className="ad-public-gallery">
                {gallery.map((g) => (
                  <figure key={g.id} className="ad-public-gallery__item">
                    <img src={g.imageUrl} alt={g.title} loading="lazy" />
                    <figcaption>
                      <strong>{g.title}</strong>
                      {g.description ? (
                        <span className="ad-public-muted block text-xs">
                          {g.description}
                        </span>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        }

        if (sec.id === "services") {
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                Servicios
              </h2>
              <p className="ad-public-muted">
                Licorería, Bodegón, mesas, prepagos y operación unificada.
              </p>
            </section>
          );
        }

        if (sec.id === "location") {
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                Ubicación
              </h2>
              {brand.showAddress ? (
                <p>{brand.address}</p>
              ) : (
                <p className="ad-public-muted">Dirección no publicada</p>
              )}
            </section>
          );
        }

        if (sec.id === "hours") {
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                Horarios
              </h2>
              {brand.showSchedule ? (
                <p>{brand.schedule}</p>
              ) : (
                <p className="ad-public-muted">Horario no publicado</p>
              )}
            </section>
          );
        }

        if (sec.id === "contact") {
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                Contacto
              </h2>
              <ul className="space-y-1 text-sm">
                {brand.showPhone ? <li>Tel: {brand.phone}</li> : null}
                {brand.showWhatsapp ? <li>WhatsApp: {brand.whatsapp}</li> : null}
                {brand.showAddress ? <li>{brand.address}</li> : null}
              </ul>
            </section>
          );
        }

        if (sec.id === "social") {
          return (
            <section key={sec.id} className="ad-public-section">
              <h2 style={{ fontFamily: design.typography.headingFont }}>
                Redes sociales
              </h2>
              <div className="flex flex-wrap gap-2">
                {brand.showInstagram ? (
                  <a className="ad-btn" href={brand.instagram} target="_blank" rel="noreferrer">
                    Instagram
                  </a>
                ) : null}
                {brand.showFacebook ? (
                  <a className="ad-btn" href={brand.facebook} target="_blank" rel="noreferrer">
                    Facebook
                  </a>
                ) : null}
                {brand.showTiktok ? (
                  <a className="ad-btn" href={brand.tiktok} target="_blank" rel="noreferrer">
                    TikTok
                  </a>
                ) : null}
              </div>
            </section>
          );
        }

        if (sec.id === "footer") {
          const f = design.footer;
          return (
            <footer key={sec.id} className="ad-public-footer">
              <div className="ad-public-footer__grid">
                <div>
                  {(f.logoUrl || brand.logoUrl) ? (
                    <img
                      src={f.logoUrl || brand.logoUrl}
                      alt=""
                      className="mb-3 h-12 w-12 object-contain"
                    />
                  ) : null}
                  <p className="text-sm ad-public-muted">{f.description}</p>
                </div>
                <div className="text-sm space-y-1">
                  <p>{f.phone || brand.phone}</p>
                  <p>{f.whatsapp || brand.whatsapp}</p>
                  <p>{f.address || brand.address}</p>
                  <p>{f.schedule || brand.schedule}</p>
                </div>
                <div className="text-sm space-y-1">
                  {f.links.map((l) => (
                    <div key={l.id}>
                      <Link to={l.href}>{l.label}</Link>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-6 text-xs ad-public-muted">
                {f.copyright}
              </p>
              <p className="text-xs ad-public-muted">
                {f.legalText || brand.legalText}
              </p>
            </footer>
          );
        }

        return null;
      })}

      {popupOpen && design.popup.enabled ? (
        <div className="ad-public-popup">
          <div className="ad-public-popup__card">
            {design.popup.imageUrl ? (
              <img src={design.popup.imageUrl} alt="" className="mb-3 max-h-40 w-full object-cover" />
            ) : null}
            <h3>{design.popup.title}</h3>
            <p className="ad-public-muted text-sm">{design.popup.text}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {design.popup.buttonHref ? (
                <Link
                  className="ad-btn ad-btn--gold"
                  to={design.popup.buttonHref}
                  onClick={closePopup}
                >
                  {design.popup.buttonLabel}
                </Link>
              ) : null}
              <button type="button" className="ad-btn" onClick={closePopup}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
