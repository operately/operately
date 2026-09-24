import i18n from "i18next";
import type { TOptions } from "i18next";
import { initReactI18next } from "react-i18next";
import { i18nOptions } from "./i18nOptions";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    ...i18nOptions,
    resources: {
      en: {
        translation: {
          intlRelativeDateTime: "{{val, relativetime}}",
          "just now": "just now",
          Today: "Today",
          Yesterday: "Yesterday",
          Tomorrow: "Tomorrow",
        },
      },
    },
  });
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
