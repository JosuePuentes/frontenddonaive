/**
 * Bridge compat · reexporta diseño v2.
 * Preferir `@/services/ad-licoreria/design/*` y `@/types/ad-licoreria-design`.
 */
export type {
  AdSiteBanner,
  AdSiteColors,
  AdSiteDesign,
  AdGalleryItem,
  AdHomeSection,
} from "@/types/ad-licoreria-design";

export {
  AD_DEFAULT_SITE_DESIGN,
  createDefaultSiteDesign,
  syncDesignMirrors,
} from "@/services/ad-licoreria/design/defaults";

export {
  AD_SITE_DESIGN_STORAGE_KEY,
  AD_SITE_DESIGN_LEGACY_KEY,
  adDesignRepository,
  migrateLegacyDesign,
} from "@/services/ad-licoreria/design/repository";

export {
  applySiteDesignToDom,
  fileToDataUrl,
} from "@/services/ad-licoreria/design/apply";

import { adDesignRepository } from "@/services/ad-licoreria/design/repository";
import type { AdSiteDesign } from "@/types/ad-licoreria-design";

/** Compat: carga publicado (o migrado). */
export function loadSiteDesignFromStorage(): AdSiteDesign | null {
  try {
    return adDesignRepository.getPublished();
  } catch {
    return null;
  }
}

export function saveSiteDesignToStorage(design: AdSiteDesign) {
  adDesignRepository.saveDraft({ design, userName: "system" });
  adDesignRepository.publish({ userName: "system" });
}
