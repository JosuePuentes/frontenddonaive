/** Hostnames oficiales del portal A&D (dominio propio — vacío hasta conectar DNS). */
export const AD_LICORERIA_HOSTNAMES = [
  // Reservados para cuando exista el dominio propio:
  // "adlicoreria.com",
  // "www.adlicoreria.com",
] as const;

/**
 * Dev/local: VITE_AD_LICORERIA_HOST=true simula el dominio propio sin DNS.
 * No inventar dominios reales hasta que el cliente los asigne.
 */
export function isAdLicoreriaHost(
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
): boolean {
  const envFlag =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env as { VITE_AD_LICORERIA_HOST?: string }).VITE_AD_LICORERIA_HOST;
  if (envFlag === "true") {
    return true;
  }
  const host = hostname.trim().toLowerCase();
  return (AD_LICORERIA_HOSTNAMES as readonly string[]).includes(host);
}

/** Prefijo: vacío en dominio propio futuro, `/licoreria` en Donaive. */
export function getAdLicoreriaBasePath(): "" | "/licoreria" {
  return isAdLicoreriaHost() ? "" : "/licoreria";
}

/** Normaliza pathname quitando el prefijo `/licoreria`. */
export function normalizeAdLicoreriaPathname(pathname: string): string {
  if (pathname === "/licoreria" || pathname === "/licoreria/") {
    return "/";
  }
  if (pathname.startsWith("/licoreria/")) {
    return pathname.slice("/licoreria".length);
  }
  return pathname;
}

/**
 * Resuelve hrefs del diseño (pueden venir con `/licoreria/...` o `/inicio`)
 * al prefijo activo del host.
 */
export function resolveAdHref(href: string | null | undefined): string {
  const base = getAdLicoreriaBasePath();
  const raw = (href ?? "").trim();
  if (!raw || raw === "/") {
    return base || "/";
  }
  if (/^https?:\/\//i.test(raw) || raw.startsWith("mailto:") || raw.startsWith("tel:")) {
    return raw;
  }
  let path = raw.startsWith("/") ? raw : `/${raw}`;
  if (path === "/licoreria" || path.startsWith("/licoreria/")) {
    path = normalizeAdLicoreriaPathname(path);
  }
  if (!base) {
    return path || "/";
  }
  if (path === "/") return base;
  return `${base}${path}`;
}
