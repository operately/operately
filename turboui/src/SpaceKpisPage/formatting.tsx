import React from "react";
import { useTranslation } from "react-i18next";
import { FormattedTime, FormattedTimePreferences, defaultFormattedTimePreferences } from "../FormattedTime";
import { formatNumber as formatLocalizedNumber } from "../utils/formatting";
import { formatNumber, formatShortDate, formatValue } from "./utils";

const KpiFormattingContext = React.createContext<FormattedTimePreferences | null>(null);
export const KpiFormattingProvider = KpiFormattingContext.Provider;

function usePreferences() {
  const { i18n } = useTranslation();
  const preferences = React.useContext(KpiFormattingContext);
  return preferences ?? { ...defaultFormattedTimePreferences, locale: i18n.resolvedLanguage ?? "en" };
}

export function useKpiFormatting() {
  const { locale } = usePreferences();
  return {
    formatCurrency: (value: number, currency: string) =>
      formatLocalizedNumber(value, locale, {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
      }),
    formatNumber: (value: number) => formatNumber(value, locale),
    formatValue: (value: number, unit?: string) => formatValue(value, unit, locale),
    formatShortDate: (date: Date, options: { withYear?: boolean } = {}) =>
      formatShortDate(date, { ...options, locale }),
  };
}

// Reporting periods are calendar days; edit history contains actual timestamps.
export function KpiDate({
  time,
  timestamp = false,
  withYear = false,
  className,
}: {
  time: Date;
  timestamp?: boolean;
  withYear?: boolean;
  className?: string;
}) {
  const preferences = usePreferences();
  const date = timestamp ? time : new Date(Date.UTC(time.getFullYear(), time.getMonth(), time.getDate()));
  const content = (
    <FormattedTime
      {...preferences}
      timezone={timestamp ? preferences.timezone : "UTC"}
      time={date}
      format="short-date"
      withYear={withYear}
    />
  );
  return className ? <span className={className}>{content}</span> : content;
}
