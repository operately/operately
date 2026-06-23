import i18n from "i18next";
import { initReactI18next } from "react-i18next";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: "en",
    resources: {
      en: {
        translation: {
          intlRelativeDateTime: "{{val, relativetime}}",
          intlRelativeDateTimeJustNow: "just now",
          Today: "Today",
          Yesterday: "Yesterday",
          Tomorrow: "Tomorrow",
        },
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });
}

export default i18n;
