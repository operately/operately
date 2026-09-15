import i18n from "i18next";
import { initReactI18next, setI18n } from "react-i18next";
import type { TOptions } from "i18next";

import en from "./generated/locales/en.json";

const FORMAT_MESSAGES = {
  intlDateTime: "{{val, datetime}}",
  intlRelativeDateTime: "{{val, relativetime}}",
};

const englishResources = {
  ...en,
  ...FORMAT_MESSAGES,
};

const initOptions = {
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en"],
  resources: {
    en: {
      translation: englishResources,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  keySeparator: false as const,
  nsSeparator: false as const,
  contextSeparator: "|",
  pluralSeparator: "_",
};

i18n.use(initReactI18next);

if (!i18n.isInitialized) {
  i18n.init(initOptions);
} else {
  i18n.addResourceBundle("en", "translation", englishResources, true, true);
}

setI18n(i18n);

export function tn(singular: string, plural: string, count: number, options: TOptions = {}) {
  return i18n.t(singular, {
    count,
    defaultValue: singular,
    defaultValue_other: plural,
    ...options,
  });
}

export default i18n;
