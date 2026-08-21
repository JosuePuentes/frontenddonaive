export type PolisurClickKind = "news" | "social" | "phone";

export type PolisurClickStats = {
  updatedAt: string;
  news: Record<string, number>;
  social: Record<string, number>;
  phone: {
    primary: number;
    alt: number;
  };
};

/** Registra un clic sin bloquear la UI. */
export function trackPolisurClick(
  kind: PolisurClickKind,
  id: string,
): void {
  if (typeof window === "undefined") return;
  const cleanId = String(id || "").trim();
  if (!cleanId) return;

  // Evita contar la misma noticia varias veces en la misma sesión.
  if (kind === "news") {
    const key = `ps-click-news:${cleanId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore storage errors
    }
  }

  void fetch("/api/polisur-clicks?action=track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id: cleanId }),
    keepalive: true,
  }).catch(() => {
    // Silencioso: el tracking no debe romper la navegación.
  });
}
