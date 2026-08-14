/** Hostnames oficiales del portal POLISUR (dominio propio). */
export const POLISUR_HOSTNAMES = [
  "polisur.com.ve",
  "www.polisur.com.ve",
] as const;

/**
 * Dev/local: VITE_POLISUR_HOST=true simula el dominio propio sin DNS.
 */
export function isPolisurHost(
  hostname = typeof window !== "undefined" ? window.location.hostname : "",
): boolean {
  if (import.meta.env.VITE_POLISUR_HOST === "true") {
    return true;
  }
  const host = hostname.trim().toLowerCase();
  return (POLISUR_HOSTNAMES as readonly string[]).includes(host);
}

/** Prefijo de rutas: vacío en dominio propio, `/polisur` en Donaive y desarrollo. */
export function getPolisurBasePath(): "" | "/polisur" {
  return isPolisurHost() ? "" : "/polisur";
}

/** Normaliza pathname quitando el prefijo legacy `/polisur`. */
export function normalizePolisurPathname(pathname: string): string {
  if (pathname === "/polisur" || pathname === "/polisur/") {
    return "/";
  }
  if (pathname.startsWith("/polisur/")) {
    return pathname.slice("/polisur".length);
  }
  return pathname;
}
