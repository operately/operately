import i18n from "i18next";
import { initReactI18next, setI18n } from "react-i18next";
import type { TOptions } from "i18next";
import { i18nOptions } from "turboui/i18nOptions";

import en from "./generated/locales/en.json";
import ptBR from "./generated/locales/pt-BR.json";
import { DEFAULT_LANGUAGE, isSupportedLanguage, SUPPORTED_LANGUAGES } from "./i18n/languages";

const FORMAT_MESSAGES = {
  intlDateTime: "{{val, datetime}}",
  intlRelativeDateTime: "{{val, relativetime}}",
};

const englishResources = {
  ...en,
  ...FORMAT_MESSAGES,
};

const portugueseResources = {
  ...ptBR,
  ...FORMAT_MESSAGES,
};

const initOptions = {
  ...i18nOptions,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  resources: {
    en: {
      translation: englishResources,
    },
    "pt-BR": {
      translation: portugueseResources,
    },
  },
};

i18n.use(initReactI18next);

if (!i18n.isInitialized) {
  i18n.init(initOptions);
} else {
  i18n.addResourceBundle("en", "translation", englishResources, true, true);
  i18n.addResourceBundle("pt-BR", "translation", portugueseResources, true, true);
  i18n.options.supportedLngs = [...SUPPORTED_LANGUAGES];
}

setI18n(i18n);

export function applyLanguage(language: string) {
  const nextLanguage = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;

  if (i18n.language === nextLanguage) return Promise.resolve(nextLanguage);

  return i18n.changeLanguage(nextLanguage);
}

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
