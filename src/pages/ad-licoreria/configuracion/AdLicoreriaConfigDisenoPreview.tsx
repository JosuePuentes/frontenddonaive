import { useMemo } from "react";
import { Link } from "react-router";
import { AdPublicHomeView } from "@/components/ad-licoreria/AdPublicHomeView";
import { AD_LICORERIA_ROUTES } from "@/constants/ad-licoreria-routes";
import { adDesignRepository } from "@/services/ad-licoreria/design/repository";
import { useAdLicoreria } from "@/providers/ad-licoreria/AdLicoreriaProvider";

/**
 * Preview del Home con el borrador actual (sessionStorage o draft repo).
 */
export default function AdLicoreriaConfigDisenoPreview() {
  const { products, presentations, categories, hasPermission, getCurrentOperator } =
    useAdLicoreria();
  const session = getCurrentOperator();
  const can = hasPermission("settings.manage") || session?.role === "admin";

  const design = useMemo(() => {
    return (
      adDesignRepository.getPreviewSession() ??
      adDesignRepository.getDraft()
    );
  }, []);

  if (!can) {
    return (
      <div className="ad-panel m-6">
        <h1 className="ad-panel-title">Acceso no autorizado</h1>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.configuracion}>
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-0 z-30 flex flex-wrap gap-2 border-b border-[var(--ad-line)] bg-[var(--ad-bg-panel)] p-3">
        <Link className="ad-btn ad-btn--gold" to={AD_LICORERIA_ROUTES.configDiseno}>
          ← Volver al editor
        </Link>
        <Link className="ad-btn" to={AD_LICORERIA_ROUTES.home}>
          Home publicado
        </Link>
      </div>
      <AdPublicHomeView
        design={design}
        products={products}
        presentations={presentations}
        categories={categories}
        previewMode
      />
    </div>
  );
}
