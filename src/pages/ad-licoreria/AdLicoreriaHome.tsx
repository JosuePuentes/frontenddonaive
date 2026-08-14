import { Link } from "react-router";
import { AdLicoreriaBrandMark } from "@/components/ad-licoreria/AdLicoreriaBrandMark";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { adLicoreriaBrand } from "@/content/ad-licoreria/brand";

export default function AdLicoreriaHome() {
  return (
    <div className="ad-landing">
      <div className="ad-landing__card">
        <div className="mb-6 flex justify-center">
          <AdLicoreriaBrandMark size="lg" showText={false} />
        </div>
        <p className="ad-eyebrow">Portal operativo</p>
        <h1 className="ad-landing__title">{adLicoreriaBrand.name}</h1>
        <p className="ad-landing__tag">{adLicoreriaBrand.tagline}</p>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[var(--ad-muted)]">
          {adLicoreriaBrand.description}
        </p>
        <div className="ad-landing__actions">
          <Link to={AD_LICORERIA_ROUTES.inicio} className="ad-btn ad-btn--gold">
            Entrar al inicio
          </Link>
          <Link
            to={AD_LICORERIA_ROUTES.ventas}
            className="ad-btn ad-btn--primary"
          >
            Abrir ventas
          </Link>
          <Link to={AD_LICORERIA_ROUTES.mesonera} className="ad-btn">
            Vista mesonera
          </Link>
        </div>
      </div>
    </div>
  );
}
