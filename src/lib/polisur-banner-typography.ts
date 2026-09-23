import type {
  PolisurBannerContent,
  PolisurBannerPanelWidth,
  PolisurBannerTextSize,
} from "@/content/polisur-site";

const TITLE: Record<PolisurBannerTextSize, string> = {
  sm: "text-2xl leading-tight sm:text-3xl lg:text-4xl",
  md: "text-[2.15rem] leading-[1.05] sm:text-5xl lg:text-6xl",
  lg: "text-[2.85rem] leading-[1.02] sm:text-6xl lg:text-7xl",
};

const SUBTITLE: Record<PolisurBannerTextSize, string> = {
  sm: "text-[0.62rem] tracking-[0.22em]",
  md: "text-[0.7rem] tracking-[0.2em]",
  lg: "text-xs tracking-[0.18em] sm:text-sm",
};

const MESSAGE: Record<PolisurBannerTextSize, string> = {
  sm: "text-xs leading-relaxed sm:text-sm",
  md: "text-[0.95rem] leading-relaxed sm:text-base",
  lg: "text-base leading-relaxed sm:text-lg",
};

const PANEL: Record<PolisurBannerPanelWidth, string> = {
  compact: "max-w-[20rem]",
  standard: "max-w-[34rem]",
  wide: "max-w-[42rem]",
};

export function polisurBannerTypography(banner: PolisurBannerContent) {
  const titleSize = banner.titleSize ?? "md";
  const subtitleSize = banner.subtitleSize ?? "md";
  const messageSize = banner.messageSize ?? "md";
  const panelWidth = banner.panelWidth ?? "standard";

  return {
    title: TITLE[titleSize],
    subtitle: SUBTITLE[subtitleSize],
    message: MESSAGE[messageSize],
    panel: PANEL[panelWidth],
  };
}
