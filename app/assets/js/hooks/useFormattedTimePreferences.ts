import type { FormattedTimePreferences } from "turboui";

import { useLocale, useTimeFormat, useTimezone } from "@/contexts/TimezoneContext";

export function useFormattedTimePreferences(): FormattedTimePreferences {
  return {
    timezone: useTimezone(),
    locale: useLocale(),
    timeFormat: useTimeFormat(),
  };
}
