/**
 * Aplica tokens CSS / favicon / title del diseño publicado o preview.
 */
import type { AdSiteDesign } from "@/types/ad-licoreria-design";
import { AD_TYPOGRAPHY_PRESETS } from "@/types/ad-licoreria-design";

export function applySiteDesignToDom(design: AdSiteDesign) {
  if (typeof document === "undefined") return;
  const root =
    (document.querySelector(".ad-shell") as HTMLElement | null) ??
    document.documentElement;
  const c = design.colors;
  root.style.setProperty("--ad-bg", c.bg);
  root.style.setProperty("--ad-bg-elevated", c.bgAlt || c.bg);
  root.style.setProperty("--ad-bg-panel", c.panel);
  root.style.setProperty("--ad-bg-card", c.card || c.panel);
  root.style.setProperty("--ad-gold", c.primary || c.gold);
  root.style.setProperty("--ad-gold-soft", c.primary || c.gold);
  root.style.setProperty("--ad-burgundy", c.secondary || c.burgundy);
  root.style.setProperty("--ad-burgundy-soft", c.secondary || c.burgundy);
  root.style.setProperty("--ad-text", c.text);
  root.style.setProperty("--ad-muted", c.muted);
  root.style.setProperty("--ad-line", c.border || "#2a2f3d");
  root.style.setProperty("--ad-success", c.success);
  root.style.setProperty("--ad-danger", c.danger);
  root.style.setProperty("--ad-warning", c.warning || "#c9a227");
  root.style.setProperty("--ad-btn", c.button || c.primary || c.gold);
  root.style.setProperty(
    "--ad-btn-hover",
    c.buttonHover || c.primary || c.gold,
  );

  const preset =
    AD_TYPOGRAPHY_PRESETS[design.typography?.preset ?? "classic"] ??
    AD_TYPOGRAPHY_PRESETS.classic;
  const heading = design.typography?.headingFont || preset.headingFont;
  const body = design.typography?.bodyFont || preset.bodyFont;
  root.style.setProperty("--ad-font-display", heading);
  root.style.setProperty("--ad-font-body", body);
  root.style.setProperty(
    "--ad-type-scale",
    String(design.typography?.scale ?? 1),
  );
  root.style.setProperty(
    "--ad-heading-weight",
    String(design.typography?.headingWeight ?? 600),
  );

  const favUrl =
    design.seo?.faviconUrl || design.brand?.faviconUrl || design.faviconUrl;
  let fav = document.querySelector<HTMLLinkElement>("link[data-ad-favicon]");
  if (!fav) {
    fav = document.createElement("link");
    fav.rel = "icon";
    fav.setAttribute("data-ad-favicon", "1");
    document.head.appendChild(fav);
  }
  if (favUrl?.trim()) fav.href = favUrl.trim();

  const title =
    design.seo?.title ||
    `${design.brand?.commercialName || design.brandName} · ${design.brand?.tagline || design.brandTagline}`;
  document.title = title;

  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="description"][data-ad-seo]',
  );
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    meta.setAttribute("data-ad-seo", "1");
    document.head.appendChild(meta);
  }
  meta.content = design.seo?.description || design.brand?.description || "";
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}
