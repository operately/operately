import * as React from "react";
import * as People from "@/models/people";

interface CurrentUserContextProps {
  me: People.Person | null;
}

const CurrentUserContext = React.createContext<CurrentUserContextProps>({
  me: null,
});

export function CurrentUserProvider({ children }) {
  console.log("fetching me");
  const { data, loading, error } = People.useGetMe({});

  if (loading) return null;
  if (error) return null;

  if (!data) {
    return null;
  }

  return <Context me={data.me}>{children}</Context>;
}

export function useMe(): People.Person {
  console.log("useMe");
  return React.useContext(CurrentUserContext).me as People.Person;
}

function Context({ me, children }) {
  return <CurrentUserContext.Provider value={{ me }}>{children}</CurrentUserContext.Provider>;
}
