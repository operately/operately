import * as React from "react";
import * as People from "@/models/people";

import { useMe } from "@/contexts/CurrentUserContext";

interface TimezoneContextProps {
  timezone: string;
}

const TimezoneContext = React.createContext<TimezoneContextProps>({
  timezone: "Etc/UTC",
});

export function TimezoneProvider({ children }) {
  const me = useMe();
  const value = initializeTimezone(me);

  return <TimezoneContext.Provider value={value!}>{children}</TimezoneContext.Provider>;
}

export function useTimezone(): string {
  return React.useContext(TimezoneContext).timezone;
}

function initializeTimezone(me: People.Person | null): TimezoneContextProps {
  if (!me || !me.timezone) {
    return { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  } else {
    return { timezone: me.timezone };
  }
}
