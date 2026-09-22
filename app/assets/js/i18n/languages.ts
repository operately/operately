export const DEFAULT_LANGUAGE = "en";
export const I18N_FEATURE_FLAG = "i18n";

export const SUPPORTED_LANGUAGES = ["en", "pt-BR"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return value === "en" || value === "pt-BR";
}

export function resolveEffectiveLanguage(
  preference: string | null | undefined,
  i18nEnabled: boolean,
): SupportedLanguage {
  if (!i18nEnabled) return DEFAULT_LANGUAGE;
  if (isSupportedLanguage(preference)) return preference;

  return DEFAULT_LANGUAGE;
}
