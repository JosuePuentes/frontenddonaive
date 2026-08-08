/**
 * Design tokens (TypeScript mirrors of CSS custom properties).
 * Prefer CSS variables in styles; use these for typed references when needed.
 */

export const colors = {
  black: "#09090B",
  white: "#FFFFFF",
  electric: "#2563FF",
  royal: "#1E3A8A",
} as const;

export const semanticColorVars = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  surface: "var(--surface)",
  surfaceMuted: "var(--surface-muted)",
  border: "var(--border)",
  primary: "var(--primary)",
  primaryHover: "var(--primary-hover)",
  secondary: "var(--secondary)",
  muted: "var(--muted)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
} as const;

export const fonts = {
  display: "var(--font-family-display)",
  body: "var(--font-family-body)",
} as const;

export const typography = {
  display: "display",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  body: "body",
  bodySmall: "body-small",
  caption: "caption",
} as const;

export const spacing = {
  pagePaddingX: "var(--page-padding-x)",
  sectionPaddingY: "var(--section-padding-y)",
  cardPadding: "var(--card-padding)",
  containerMax: "var(--container-max)",
  containerNarrow: "var(--container-narrow)",
  containerWide: "var(--container-wide)",
} as const;

export const radii = {
  none: "var(--radius-none)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  full: "var(--radius-full)",
} as const;

export const shadows = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  primaryGlow: "var(--shadow-primary-glow)",
} as const;

export const motion = {
  durationFast: "var(--duration-fast)",
  durationNormal: "var(--duration-normal)",
  durationSlow: "var(--duration-slow)",
  easeStandard: "var(--ease-standard)",
  easeEmphasized: "var(--ease-emphasized)",
  easeEntrance: "var(--ease-entrance)",
  easeExit: "var(--ease-exit)",
} as const;

export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];
