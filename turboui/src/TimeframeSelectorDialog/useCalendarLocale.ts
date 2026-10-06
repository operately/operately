import { enUS, ptBR } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import i18n from "../i18n";

registerLocale("en", enUS);
registerLocale("pt-BR", ptBR);

// react-datepicker's month accessibility labels use its default locale rather
// than the locale prop. Keep it aligned with the single app-controlled language.
function syncCalendarLocale() {
  setDefaultLocale(i18n.resolvedLanguage === "pt-BR" ? "pt-BR" : "en");
}

syncCalendarLocale();
i18n.on("languageChanged", syncCalendarLocale);

export function useCalendarLocale() {
  const { t, i18n } = useTranslation();

  return {
    locale: i18n.resolvedLanguage === "pt-BR" ? ptBR : enUS,
    chooseDayAriaLabelPrefix: t("Choose"),
    disabledDayAriaLabelPrefix: t("Not available"),
    monthAriaLabelPrefix: t("Month"),
    weekAriaLabelPrefix: t("Week"),
    previousMonthAriaLabel: t("Previous month"),
    nextMonthAriaLabel: t("Next month"),
    previousYearAriaLabel: t("Previous year"),
    nextYearAriaLabel: t("Next year"),
  };
}
