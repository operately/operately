import "i18next";

// Match the shared runtime setting so string props do not need null coercion.
declare module "i18next" {
  interface CustomTypeOptions {
    returnNull: false;
  }
}

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
