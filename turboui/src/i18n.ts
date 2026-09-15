import i18n from "i18next";
import { initReactI18next } from "react-i18next";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
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
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    keySeparator: false,
    nsSeparator: false,
  });
}

export default i18n;
