import * as React from "react";
import * as People from "@/models/people";
import { browserLocale } from "@/utils/formatting";
import type { TimeFormat } from "@/utils/formatting";

import { useMe } from "@/contexts/CurrentCompanyContext";

interface TimezoneContextProps {
  timezone: string;
  locale: string;
  timeFormat: TimeFormat;
}

const TimezoneContext = React.createContext<TimezoneContextProps>({
  timezone: "Etc/UTC",
  locale: "en-US",
  timeFormat: "automatic",
});

export function TimezoneProvider({ children }) {
  const me = useMe();
  const value = initializeTimezone(me);

  return <TimezoneContext.Provider value={value!}>{children}</TimezoneContext.Provider>;
}

export function useTimezone(): string {
  return React.useContext(TimezoneContext).timezone;
}

export function useLocale(): string {
  return React.useContext(TimezoneContext).locale;
}

export function useTimeFormat(): TimeFormat {
  return React.useContext(TimezoneContext).timeFormat;
}

function initializeTimezone(me: People.Person | null): TimezoneContextProps {
  const locale = browserLocale();

  if (!me || !me.timezone) {
    return { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale, timeFormat: "automatic" };
  } else {
    return { timezone: me.timezone, locale, timeFormat: me.timeFormat || "automatic" };
  }
}
