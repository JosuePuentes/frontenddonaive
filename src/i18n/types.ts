export type LocaleCode = "es" | "en";

export type Dictionary = Record<string, string>;

export type LocaleConfig = {
  code: LocaleCode;
  label: string;
  default?: boolean;
};
