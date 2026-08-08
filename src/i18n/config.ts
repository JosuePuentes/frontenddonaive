import type { LocaleCode, LocaleConfig } from "@/i18n/types";

export const defaultLocale: LocaleCode = "es";

export const locales: LocaleConfig[] = [
  { code: "es", label: "Español", default: true },
  { code: "en", label: "English" },
];

export const i18nConfig = {
  defaultLocale,
  locales,
  // Translations will be added in a later iteration.
  enabled: false,
} as const;
