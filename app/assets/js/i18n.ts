import i18n from "i18next";
import { initReactI18next, setI18n } from "react-i18next";
import type { TOptions } from "i18next";
import { i18nOptions } from "turboui/i18nOptions";

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
  ...i18nOptions,
  supportedLngs: ["en"],
  resources: {
    en: {
      translation: englishResources,
    },
  },
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

export function translationText(value: string | null | undefined): string {
  return value ?? "";
}

export default i18n;
