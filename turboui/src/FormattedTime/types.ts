import type { TimeFormat } from "../ApiTypes";

export interface FormattedTimePreferences {
  locale: string;
  timezone: string;
  timeFormat: TimeFormat;
}

export const defaultFormattedTimePreferences: FormattedTimePreferences = {
  locale: "en-US",
  timezone: "UTC",
  timeFormat: "automatic",
};
