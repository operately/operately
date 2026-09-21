import i18n from "i18next";
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

export default i18n;
