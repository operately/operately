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

          erorr: {
            "error": "Error",
          },

          loading: {
            "loading": "Loading...",
          },

          actions: {
            "add_group": "Add Group",
            "add_person": "Add Person",
            "add_project": "Add Project",
            "add_kpi": "Add KPI",
            "add_objective": "Add Objective",
            "add_tenet": "Add Tenet",
          },

          forms: {
            "save": "Save",
            "cancel": "Cancel",

            "group_add_title": "Add Group",
            "group_name_label": "Name",
            "group_name_placeholder": "ex. Marketing",

            "kpi_add_title": "Add KPI",
            "kpi_name_label": "Name",
            "kpi_name_placeholder": "ex. Revenue",
            "kpi_description_label": "Description",
            "kpi_description_placeholder": "ex. Total revenue from sales",
            "kpi_unit_label": "Unit",
            "kpi_unit_percentage": "percentage",
            "kpi_unit_currency": "currency",
            "kpi_target_label": "Target",
            "kpi_target_placeholder": "ex. 1000000",
            "kpi_target_direction_label": "Target Direction",
            "kpi_target_direction_above": "Above",
            "kpi_target_direction_below": "Below",
            "kpi_warning_trigger_label": "Warning Threshold",
            "kpi_warning_trigger_placeholder": "ex. 500000",
            "kpi_danger_threshold_label": "Danger Threshold",
            "kpi_danger_threshold_placeholder": "ex. 100000",
            "kpi_danger_direction_label": "Danger Direction",
            "kpi_warning_direction_label": "Warning Direction",

            "objective_add_title": "Add Objective",
            "objective_name_label": "Name",
            "objective_name_placeholder": "ex. Increase revenue",
            "objective_description_label": "Description",
            "objective_description_placeholder": "ex. Increase revenue by 10%",
            "objective_owner_label": "Owner",
            "objective_owenr_search_placeholder": "Search for a person...",
            "objective_timeline_label": "Timeframe",
            "objective_timeframe_current_quarter": "Current Quarter",

            "project_add_title": "Add Project",
            "project_name_label": "Name",
            "project_name_placeholder": "ex. New Website",
            "project_description_label": "Description",
            "project_description_placeholder": "ex. Create a new website for the company",

            "tenet_add_title": "Add Tenet",
            "tenet_name_label": "Name",
            "tenet_name_placeholder": "ex. Customer First",
            "tenet_description_label": "Description",
            "tenet_description_placeholder": "ex. Always put the customer first",

            "add_group_members_title": "Add Group Members",
            "add_group_members_search_placeholder": "Search for a person...",
            "add_group_members_button": "Add Members",
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

          actions: {
            "add_group": "Додај групу",
            "add_person": "Додај човека",
            "add_project": "Додај пројекат",
            "add_kpi": "Додај мерило",
            "add_objective": "Додај циљ",
            "add_tenet": "Додај основни принцип",
          },

          forms: {
            "save": "Сачувај",
            "cancel": "Откажи",

            "group_add_title": "Додај групу",
            "group_name_label": "Назив",
            "group_name_placeholder": "нпр. Маркетинг",

            "kpi_add_title": "Додај мерило",
            "kpi_name_label": "Назив",
            "kpi_name_placeholder": "нпр. Приходи",
            "kpi_description_label": "Опис",
            "kpi_description_placeholder": "нпр. Укупни приходи од продаје",
            "kpi_unit_label": "Mерна јединица",
            "kpi_unit_percentage": "проценат",
            "kpi_unit_currency": "валута",
            "kpi_target_label": "Циљ",
            "kpi_target_placeholder": "нпр. 1000000",
            "kpi_target_direction_label": "Смер циља",
            "kpi_target_direction_above": "Изнад",
            "kpi_target_direction_below": "Испод",
            "kpi_warning_threshold_label": "Праг упозорења",
            "kpi_warning_threshold_placeholder": "нпр. 500000",
            "kpi_danger_threshold_label": "Праг опасности",
            "kpi_danger_threshold_placeholder": "нпр. 100000",
            "kpi_danger_direction_label": "Смер опасности",
            "kpi_warning_direction_label": "Смер упозорења",

            "objective_add_title": "Додај циљ",
            "objective_name_label": "Назив",
            "objective_name_placeholder": "нпр. Повећај приходе",
            "objective_description_label": "Опис",
            "objective_description_placeholder": "нпр. Повећај приходе за 10%",
            "objective_owner_label": "Oдговорно лице",
            "objective_owner_search_placeholder": "Пронађи човека...",
            "objective_timeframe_label": "Рок",
            "objective_timeframe_current_quarter": "Тренутни квартал",

            "project_add_title": "Додај пројекат",
            "project_name_label": "Назив",
            "project_name_placeholder": "нпр. Нови вебсајт",
            "project_description_label": "Опис",
            "project_description_placeholder": "нпр. Направи нови вебсајт за компанију",

            "tenet_add_title": "Додај основни принцип",
            "tenet_name_label": "Назив",
            "tenet_name_placeholder": "нпр. Клијент први",
            "tenet_description_label": "Опис",
            "tenet_description_placeholder": "нпр. Увек стави клијента првог",

            "add_group_members_title": "Додај чланове групе",
            "add_group_members_search_placeholder": "Прonaђи човека...",
            "add_group_members_button": "Додај чланове",
          }
        },
      },
    },
    returnNull: false,
    lng: "sr-Cyrl-RS",
    fallbackLng: "en",
  });

export default i18n;
