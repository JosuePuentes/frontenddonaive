/** Hostnames oficiales de Donaive Software (dominio propio — vacío hasta DNS). */
export const DONAIVE_SOFTWARE_HOSTNAMES = [
  // "software.donaive.com.ve",
  // "app.donaive.com.ve",
] as const;

/**
 * Hosts del proyecto Vercel `donaive-software`.
 * Cubre producción y previews sin hardcodear hash.
 */
export function isDonaiveSoftwareVercelHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase();
  if (!host.endsWith(".vercel.app")) return false;
  return (
    host === "donaive-software.vercel.app" ||
    host.startsWith("donaive-software-")
  );
}

/**
 * Dev: VITE_DONAIVE_SOFTWARE_HOST=true simula dominio propio.
 * Desktop: VITE_DONAIVE_DESKTOP=true o window.donaiveDesktop.
 * Producción: hostname del proyecto Vercel o lista DNS.
 */
export function isDonaiveDesktopRuntime(): boolean {
  if (import.meta.env.VITE_DONAIVE_DESKTOP === "true") return true;
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as Window & { donaiveDesktop?: { isDesktop?: boolean } })
      .donaiveDesktop?.isDesktop,
  );
}

export function isDonaiveSoftwareHost(
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
): boolean {
  if (import.meta.env.VITE_DONAIVE_SOFTWARE_HOST === "true") {
    return true;
  }
  if (isDonaiveDesktopRuntime()) return true;
  const host = hostname.trim().toLowerCase();
  if ((DONAIVE_SOFTWARE_HOSTNAMES as readonly string[]).includes(host)) {
    return true;
  }
  return isDonaiveSoftwareVercelHostname(host);
}

/** Prefijo: vacío en dominio propio, `/software` en Donaive. */
export function getDonaiveSoftwareBasePath(): "" | "/software" {
  return isDonaiveSoftwareHost() ? "" : "/software";
}

export function normalizeDonaiveSoftwarePathname(pathname: string): string {
  if (pathname === "/software" || pathname === "/software/") return "/";
  if (pathname.startsWith("/software/")) {
    return pathname.slice("/software".length);
  }
  return pathname;
}

export function resolveDsHref(href: string | null | undefined): string {
  const base = getDonaiveSoftwareBasePath();
  const raw = (href ?? "").trim();
  if (!raw || raw === "/") return base || "/";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("mailto:")) return raw;
  let path = raw.startsWith("/") ? raw : `/${raw}`;
  if (path === "/software" || path.startsWith("/software/")) {
    path = normalizeDonaiveSoftwarePathname(path);
  }
  if (!base) return path || "/";
  if (path === "/") return base;
  return `${base}${path}`;
}
