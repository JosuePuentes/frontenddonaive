const STORAGE_PREFIX = "polisur-asset-rev:";

/** `public/polisur/...` desde URL pública `/polisur/...` o ruta repo. */
export function polisurRepoPathFromSrc(src: string): string {
  const base = src.split("?")[0].split("#")[0];
  if (base.startsWith("public/polisur/")) return base;
  if (base.startsWith("/polisur/")) return `public${base}`;
  return base;
}

/** Tras subir en /medios, fuerza recarga visual en el portal (misma pestaña). */
export function bumpPolisurAssetRevision(repoOrPublicPath: string): void {
  if (typeof sessionStorage === "undefined") return;
  const repo = polisurRepoPathFromSrc(repoOrPublicPath);
  sessionStorage.setItem(STORAGE_PREFIX + repo, String(Date.now()));
  window.dispatchEvent(
    new CustomEvent("polisur-asset-updated", { detail: { path: repo } }),
  );
}

/** Evita que el navegador muestre la foto vieja tras reemplazar en GitHub. */
export function polisurAssetUrl(src: string, fallbackRev?: string): string {
  if (!src || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  const [base] = src.split("?");
  const repo = polisurRepoPathFromSrc(base);
  let rev: string | null = null;
  if (typeof sessionStorage !== "undefined") {
    rev = sessionStorage.getItem(STORAGE_PREFIX + repo);
  }
  const token = rev || fallbackRev || "";
  if (!token) return src;
  return `${base}?v=${encodeURIComponent(token)}`;
}
