// Keep catalog lookup identical whichever package initializes i18next first.
export const i18nOptions = {
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  keySeparator: false as const,
  nsSeparator: false as const,
  contextSeparator: "|",
  pluralSeparator: "_",
};
