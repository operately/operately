import * as React from "react";
import * as People from "@/models/people";

interface CurrentUserContextProps {
  me: People.Person | null;
}

const CurrentUserContext = React.createContext<CurrentUserContextProps>({
  me: null,
});

export function CurrentUserProvider({ children }) {
  const { data, loading, error } = People.useMe({});

  if (loading) return null;
  if (error) return null;

  if (!data) {
    return null;
  }

  return <Context me={data.me}>{children}</Context>;
}

export function useMe(): People.Person {
  return React.useContext(CurrentUserContext).me as People.Person;
}

function Context({ me, children }) {
  return <CurrentUserContext.Provider value={{ me }}>{children}</CurrentUserContext.Provider>;
}
