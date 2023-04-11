import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "en": {
        translation: {
          "Objectives": "objectives",
          "Tenets": "tenets",
          "Projects": "projects",
          "KPIs": "KPIs",
          "groups": "groups",
          "people": "people",

          forms: {
            "save": "Save",
            "cancel": "Cancel",

            "group_add_title": "Add Group",
            "group_name_label": "Name",
            "group_name_placeholder": "ex. Marketing",
          }
        },
      },
      "sr-Cyrl-RS": {
        translation: {
          "Objectives": "Циљеви",
          "Tenets": "Основни принципи",
          "Projects": "Пројекти",
          "KPIs": "Mерила",
          "Groups": "Групе",
          "People": "Људи",

          forms: {
            "save": "Сачувај",
            "cancel": "Откажи",

            "group_add_title": "Додај групу",
            "group_name_label": "Назив",
            "group_name_placeholder": "нпр. Маркетинг",
          }
        },
      },
    },
    returnNull: false,
    lng: "sr-Cyrl-RS",
    fallbackLng: "en",
  });

export default i18n;
