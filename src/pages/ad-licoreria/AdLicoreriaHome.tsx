import { Link } from "react-router";
import { useSyncExternalStore } from "react";
import { AdPublicHomeView } from "@/components/ad-licoreria/AdPublicHomeView";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { roleHomePath } from "@/lib/ad-licoreria/nav-by-role";
import type { AdRole } from "@/types/ad-licoreria";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";
import {
  isAdSessionValid,
  loadAdSession,
  subscribeAdSession,
} from "@/services/ad-licoreria/session";
import { getAdDataSourceMode } from "@/services/ad-licoreria/repository-adapter";

/** Home público — consume únicamente el diseño PUBLICADO. */
export default function AdLicoreriaHome() {
  const { siteDesign, products, presentations, categories } = useAdLicoreria();
  const mode = getAdDataSourceMode();
  const apiSession = useSyncExternalStore(
    subscribeAdSession,
    loadAdSession,
    () => null,
  );
  const authenticated = mode === "api" && isAdSessionValid(apiSession);

  return (
    <AdPublicHomeView
      design={siteDesign}
      products={products}
      presentations={presentations}
      categories={categories}
      authAction={
        authenticated ? (
          <Link
            to={roleHomePath(apiSession!.role as AdRole)}
            className="ad-btn ad-btn--gold"
          >
            Entrar al sistema
          </Link>
        ) : (
          <Link to={AD_LICORERIA_ROUTES.login} className="ad-btn ad-btn--gold">
            Iniciar sesión
          </Link>
        )
      }
    />
  );
}
