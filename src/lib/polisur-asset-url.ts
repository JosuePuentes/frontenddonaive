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

/** Sirve la foto desde GitHub vía API (sin esperar deploy de Vercel). */
export function polisurAssetProxyUrl(src: string, rev?: string): string {
  const [base] = src.split("?");
  const repo = polisurRepoPathFromSrc(base);
  const params = new URLSearchParams({ action: "asset", path: repo });
  if (rev) params.set("v", rev);
  return `/api/polisur-medios?${params.toString()}`;
}

function revisionToken(src: string, fallbackRev?: string): string {
  const repo = polisurRepoPathFromSrc(src.split("?")[0]);
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem(STORAGE_PREFIX + repo);
    if (stored) return stored;
  }
  return fallbackRev || "";
}

/** Evita caché del navegador tras reemplazar fotos fijas del home. */
export function polisurAssetUrl(src: string, fallbackRev?: string): string {
  if (!src || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  const [base] = src.split("?");
  const token = revisionToken(base, fallbackRev);

  // Noticias y galería: leer directo del repo (publicación inmediata).
  if (base.startsWith("/polisur/extras/")) {
    return polisurAssetProxyUrl(base, token || undefined);
  }

  if (!token) return src;
  return `${base}?v=${encodeURIComponent(token)}`;
}

export function polisurAssetFallbackUrl(src: string): string | null {
  if (!src || src.startsWith("http://") || src.startsWith("https://")) {
    return null;
  }
  const [base] = src.split("?");
  if (!base.startsWith("/polisur/")) return null;
  if (base.startsWith("/polisur/extras/")) return null;
  const token = revisionToken(base);
  return polisurAssetProxyUrl(base, token || undefined);
}
