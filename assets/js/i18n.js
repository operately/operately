import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      "en": {
        translation: {
          "intlDateTime": "{{val, datetime}}",
          "intlRelativeDateTime": "{{val, relativetime}}",
          "intlRelativeDateTimeJustNow": "just now",

          "Objectives": "Objectives",
          "Tenets": "Tenets",
          "Projects": "Projects",
          "KPIs": "KPIs",
          "Groups": "Groups",
          "People": "People",

          erorr: {
            "error": "Error",
          },

          loading: {
            "loading": "Loading...",
          },

          actions: {
            "add_group": "Add Group",
            "add_person": "Add Person",
            "add_project": "New Project",
            "add_kpi": "New Kpi",
            "add_objective": "Add Objective",
            "add_tenet": "New Tenet",
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
            "kpi_target_direction_label": "Target direction",
            "kpi_target_direction_above": "above",
            "kpi_target_direction_below": "below",
            "kpi_warning_threshold_label": "Warning threshold",
            "kpi_warning_threshold_placeholder": "ex. 500000",
            "kpi_danger_threshold_label": "Danger threshold",
            "kpi_danger_threshold_placeholder": "ex. 100000",
            "kpi_danger_direction_label": "Danger direction",
            "kpi_warning_direction_label": "Warning direction",

            "objective_add_title": "Add Objective",
            "objective_name_label": "Name",
            "objective_name_placeholder": "ex. Increase revenue",
            "objective_description_label": "Description",
            "objective_description_placeholder": "ex. Increase revenue by 10%",
            "objective_owner_label": "Owner",
            "objective_owner_search_placeholder": "Search for a person...",
            "objective_timeframe_label": "Timeframe",
            "objective_timeframe_current_quarter": "Current quarter",

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
          },

          "keyResults": {
            "status": "Status",
            "completion": "Completion",
            "lastUpdated": "Last Updated",
            "keyResult": "Key Result",

            "statuses": {
              "pending": "Pending",
              "on_track": "On Track",
              "at_risk": "At Risk",
              "off_track": "Off Track",
              "completed": "Completed",
              "cancelled": "Cancelled",
            }
          },

          "objectives": {
            "projects_in_progress_title": "Projects in Progress",

            "project_list_title": "Project Title",
            "project_list_timeline": "Timeline",
            "project_list_team": "Team",
            "project_list_last_updated": "Last Updated",

            "write_an_update": {
              "title": "POST AN UPDATE",
              "placeholder": "Write an update…",
              "cta": "Is there an important update about your objective as a whole? Share any progress and risks.",
              "button": "Write an update",
            },

            "leave_comment": {
              "placeholder": "Leave a comment",
            },

            "feed": {
              "title": "FEED",
            }
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
          },

          "keyResults": {
            "status": "Cтатус",
            "completion": "Cтепен завршетка",
            "lastUpdated": "Последња ажурирања",
            "keyResult": "Кључни резултат",

            "statuses": {
              "pending": "Почетак",
            }
          }
        },
      },
      "hu": {
        translation: {
          "Objectives": "Célok",
          "Tenets": "Alapelvek",
          "Projects": "Projektek",
          "KPIs": "Mérőszámok",
          "Groups": "Csoportok",
          "People": "Személyek",

          erorr: {
            "error": "Hiba",
          },

          loading: {
            "loading": "Betöltés...",
          },

          actions: {
            "add_group": "Uj csoport",
            "add_person": "Új személy",
            "add_project": "Új projekt",
            "add_kpi": "Új mérőszám",
            "add_objective": "Új cél",
            "add_tenet": "Új alapelv",
          },

          forms: {
            "save": "Mentés",
            "cancel": "Mégse",

            "group_add_title": "Új csoport",
            "group_name_label": "Név",
            "group_name_placeholder": "pl. Marketing",

            "kpi_add_title": "Új mérőszám",
            "kpi_name_label": "Név",
            "kpi_name_placeholder": "pl. Bevételek",
            "kpi_description_label": "Leírás",
            "kpi_description_placeholder": "pl. Az összes bevételek eladásokból",
            "kpi_unit_label": "Mértékegység",
            "kpi_unit_percentage": "százalék",
            "kpi_unit_currency": "pénznem",
            "kpi_target_label": "Cél",
            "kpi_target_placeholder": "pl. 1000000",
            "kpi_target_direction_label": "Cél iránya",
            "kpi_target_direction_above": "Nagyobb",
            "kpi_target_direction_below": "Kisebb",
            "kpi_warning_trigger_label": "Figyelmeztetési küszöb",
            "kpi_warning_trigger_placeholder": "pl. 500000",
            "kpi_danger_threshold_label": "Veszély küszöb",
            "kpi_danger_threshold_placeholder": "pl. 100000",
            "kpi_danger_direction_label": "Veszély iránya",
            "kpi_warning_direction_label": "Figyelmeztetés iránya",

            "objective_add_title": "Új cél",
            "objective_name_label": "Név",
            "objective_name_placeholder": "pl. Bevételek növelése",
            "objective_description_label": "Leírás",
            "objective_description_placeholder": "pl. Bevételek növelése 10%-kal",
            "objective_owner_label": "Felelős",
            "objective_owner_search_placeholder": "Keresés személyek között...",
            "objective_timeframe_label": "Időkeret",
            "objective_timeframe_current_quarter": "Jelenlegi negyedév",

            "project_add_title": "Új projekt",
            "project_name_label": "Név",
            "project_name_placeholder": "pl. Új weboldal",
            "project_description_label": "Leírás",
            "project_description_placeholder": "pl. Új weboldal készítése a cégnek",

            "tenet_add_title": "Új alapelv",
            "tenet_name_label": "Név",
            "tenet_name_placeholder": "pl. A használó az első",
            "tenet_description_label": "Leírás",
            "tenet_description_placeholder": "pl. Mindig a használó érdekében cselekszünk",

            "add_group_members_title": "Csoport tagjainak hozzáadása",
            "add_group_members_search_placeholder": "Keresés személyek között...",
            "add_group_members_button": "Csoport tagjainak hozzáadása",
          },

          "keyResults": {
            "status": "Státusz",
            "completion": "Teljesítés",
            "lastUpdated": "Utolsó frissítés",
            "keyResult": "Kulcs eredmény",

            "statuses": {
              "pending": "Indítás",
            }
          }
        },
      },
      "jp": {
        translation: {
          "Objectives": "目的",
          "Tenets": "原則",
          "Projects": "プロジェクト",
          "KPIs": "KPIs",
          "Groups": "団体",
          "People": "人々",

          erorr: {
            "error": "エラー",
          },

          loading: {
            "loading": "読み込み中...",
          },

          actions: {
            "add_group": "新しいグループ",
            "add_person": "新しい人",
            "add_project": "新しいプロジェクト",
            "add_kpi": "新しいKPI",
            "add_objective": "新しい目的",
            "add_tenet": "新しい原則",
          },

          forms: {
            "save": "保存する",
            "cancel": "キャンセル",

            "group_add_title": "新しいグループ",
            "group_name_label": "名前",
            "group_name_placeholder": "例：マーケティング",

            "kpi_add_title": "新しいKPI",
            "kpi_name_label": "名前",
            "kpi_name_placeholder": "例：収益",
            "kpi_description_label": "説明",
            "kpi_description_placeholder": "例：すべての収益は売上から来る",
            "kpi_unit_label": "単位",
            "kpi_unit_percentage": "パーセンテージ",
            "kpi_unit_currency": "通貨",
            "kpi_target_label": "目標",
            "kpi_target_placeholder": "例：1000000",
            "kpi_target_direction_label": "目標の方向",
            "kpi_target_direction_above": "上",
            "kpi_target_direction_below": "下",
            "kpi_warning_trigger_label": "警告のしきい値",
            "kpi_warning_trigger_placeholder": "例：500000",
            "kpi_danger_threshold_label": "危険なしきい値",
            "kpi_danger_threshold_placeholder": "例：100000",
            "kpi_danger_direction_label": "危険な方向",
            "kpi_warning_direction_label": "警告の方向",

            "objective_add_title": "新しい目的",
            "objective_name_label": "名前",
            "objective_name_placeholder": "例：収益の増加",
            "objective_description_label": "説明",
            "objective_description_placeholder": "例：収益を10％増やす",
            "objective_owner_label": "所有者",
            "objective_owner_search_placeholder": "人々を検索...",
            "objective_timeframe_label": "時間枠",
            "objective_timeframe_current_quarter": "現在の四半期",

            "project_add_title": "新しいプロジェクト",
            "project_name_label": "名前",
            "project_name_placeholder": "例：新しいウェブサイト",
            "project_description_label": "説明",
            "project_description_placeholder": "例：会社の新しいウェブサイトを作成する",

            "tenet_add_title": "新しい原則",
            "tenet_name_label": "名前",
            "tenet_name_placeholder": "例：ユーザー第一",
            "tenet_description_label": "説明",
            "tenet_description_placeholder": "例：常にユーザーのために行動する",

            "add_group_members_title": "グループメンバーの追加",
            "add_group_members_search_placeholder": "人々を検索...",
            "add_group_members_button": "グループメンバーを追加",
          },

          "keyResults": {
            "status": "スターテス",
            "completion": "完了",
            "lastUpdated": "最終更新",
            "keyResult": "キーリザルト",

            "statuses": {
              "pending": "開始",
            }
          }
        },
      }
    },
    returnNull: false,
    lng: "en",
    fallbackLng: "en",
  });

export default i18n;
