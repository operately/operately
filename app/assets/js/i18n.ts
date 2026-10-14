import i18n from "i18next";
import { initReactI18next, setI18n } from "react-i18next";
import type { TOptions } from "i18next";
import { i18nOptions } from "turboui";

import de from "./generated/locales/de.json";
import en from "./generated/locales/en.json";
import es from "./generated/locales/es.json";
import fr from "./generated/locales/fr.json";
import ptBR from "./generated/locales/pt-BR.json";
import ru from "./generated/locales/ru.json";
import { DEFAULT_LANGUAGE, isSupportedLanguage, SUPPORTED_LANGUAGES } from "./i18n/languages";

// The app and TurboUI install separate package types but share this runtime setting.
declare module "i18next" {
  interface CustomTypeOptions {
    returnNull: false;
  }
}

const FORMAT_MESSAGES = {
  intlDateTime: "{{val, datetime}}",
  intlRelativeDateTime: "{{val, relativetime}}",
};

const englishResources = {
  ...en,
  ...FORMAT_MESSAGES,
};

const spanishResources = {
  ...es,
  ...FORMAT_MESSAGES,
};

const frenchResources = {
  ...fr,
  ...FORMAT_MESSAGES,
};

const germanResources = {
  ...de,
  ...FORMAT_MESSAGES,
};

const portugueseResources = {
  ...ptBR,
  ...FORMAT_MESSAGES,
};

const russianResources = {
  ...ru,
  ...FORMAT_MESSAGES,
};

const initOptions = {
  ...i18nOptions,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  resources: {
    es: { translation: spanishResources },
    fr: { translation: frenchResources },
    ru: { translation: russianResources },
    de: {
      translation: germanResources,
    },
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
  i18n.addResourceBundle("es", "translation", spanishResources, true, true);
  i18n.addResourceBundle("fr", "translation", frenchResources, true, true);
  i18n.addResourceBundle("ru", "translation", russianResources, true, true);
  i18n.addResourceBundle("de", "translation", germanResources, true, true);
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
    defaultValue: count === 1 ? singular : plural,
    defaultValue_other: plural,
    ...options,
  });
}

export function translationText(value: string | null | undefined): string {
  return value ?? "";
}

export default i18n;
