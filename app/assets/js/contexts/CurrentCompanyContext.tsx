import * as People from "@/models/people";
import * as React from "react";

import { useProfileUpdatedSignal } from "@/signals";
import { throttle } from "@/utils/throttle";

import { compareIds, useOptionalPaths } from "@/routes/paths";

interface CurrentCompanyContextProps {
  me: People.Person | null;

  people: People.Person[] | null;
  peopleLoading: boolean;
  peopleRefetch: () => void;
}

const CurrentCompanyContext = React.createContext<CurrentCompanyContextProps | null>(null);

export function CurrentCompanyProvider({ children }) {
  const { data: meData, refetch: meRefetch } = People.useGetMe({ includeManager: true });
  const { data: peopleData, isPending: peopleLoading, refetch: peopleRefetch } = People.useCompanyPeople();
  const throttledPeopleRefetch = React.useMemo(() => throttle(peopleRefetch, 60 * 1000), [peopleRefetch]);

  useProfileUpdatedSignal(meRefetch);

  const ctx = {
    me: meData?.me || null,
    people: peopleData?.people ?? null,
    peopleLoading,
    peopleRefetch: throttledPeopleRefetch,
  };

  if (!ctx.me) return null;

  return <CurrentCompanyContext.Provider value={ctx}>{children}</CurrentCompanyContext.Provider>;
}

export function useMe(): People.Person | null {
  const ctx = React.useContext(CurrentCompanyContext);
  if (!ctx) return null;

  return ctx.me;
}

export function useMentionedPersonLookupFn(): (
  id: string,
) => Promise<(People.Person & { profileLink: string }) | null> {
  const paths = useOptionalPaths();
  const ctx = React.useContext(CurrentCompanyContext);

  if (!ctx || !paths) {
    return async () => null;
  }

  if (ctx.peopleLoading) {
    return async () => null;
  }

  return async (id: string) => {
    const person = ctx.people?.find((p) => compareIds(p.id, id));
    if (person) {
      return { ...person, profileLink: paths.profilePath(person.id) };
    }
    ctx.peopleRefetch();
    return null;
  };
}
