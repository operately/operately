import { enUS, ptBR } from "date-fns/locale";
import { useTranslation } from "react-i18next";

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
