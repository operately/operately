import * as React from "react";
import * as People from "@/models/people";

import { useProfileUpdatedSignal } from "@/signals";

interface CurrentUserContextProps {
  me: People.Person | null;
}

const CurrentUserContext = React.createContext<CurrentUserContextProps | null>(null);

export function CurrentUserProvider({ children }) {
  const { data, loading, error, refetch } = People.useGetMe({
    includeManager: true,
  });

  useProfileUpdatedSignal(() => {
    refetch();
  });

  if (loading) return null;
  if (error) return null;

  if (!data) {
    return null;
  }

  return <Context me={data.me}>{children}</Context>;
}

export function useMe(): People.Person | null {
  return React.useContext(CurrentUserContext)?.me || null;
}

function Context({ me, children }) {
  return <CurrentUserContext.Provider value={{ me }}>{children}</CurrentUserContext.Provider>;
}
