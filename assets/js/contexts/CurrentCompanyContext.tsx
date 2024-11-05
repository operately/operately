import * as React from "react";
import * as People from "@/models/people";

import { useProfileUpdatedSignal } from "@/signals";
import { assertPresent } from "@/utils/assertions";
import { throttle } from "@/utils/throttle";

interface CurrentCompanyContextProps {
  me: People.Person | null;

  people: People.Person[] | null;
  peopleLoading: boolean;
  peopleRefetch: () => void;
}

const CurrentCompanyContext = React.createContext<CurrentCompanyContextProps | null>(null);

export function CurrentCompanyProvider({ children }) {
  const { data: meData, refetch: meRefetch } = People.useGetMe({ includeManager: true });
  const {
    data: peopleData,
    loading: peopleLoading,
    refetch: peopleRefetch,
  } = People.useGetPeople({ includeSuspended: true });

  useProfileUpdatedSignal(meRefetch);
  useRevalidateStalePeopleCache(peopleRefetch);

  const ctx = {
    me: meData?.me || null,
    people: peopleData?.people?.map((p) => p!) || null,
    peopleLoading,
    peopleRefetch: throttle(peopleRefetch, 60 * 1000),
  };

  if (!ctx.me) return null;

  return <CurrentCompanyContext.Provider value={ctx}>{children}</CurrentCompanyContext.Provider>;
}

export function useMe(): People.Person | null {
  const ctx = React.useContext(CurrentCompanyContext);
  if (!ctx) return null;

  return ctx.me;
}

export function usePersonNameAndAvatar(id: string): { fullName: string; avatar: string; loading: boolean } {
  const loading = { fullName: "", avatar: "", loading: true };

  const ctx = React.useContext(CurrentCompanyContext);
  if (!ctx) return loading;
  if (ctx.peopleLoading) return loading;

  assertPresent(ctx.people, "people must be present if peopleLoading is false");

  const person = ctx.people.find((p) => p.id === id);
  if (!person) {
    ctx.peopleRefetch();
    return loading;
  }

  return { fullName: person.fullName!, avatar: person.avatarUrl!, loading: false };
}

const THREE_HOURS = 3 * 60 * 60 * 1000;

function useRevalidateStalePeopleCache(peopleRefetch: () => void) {
  React.useEffect(() => {
    const interval = setInterval(() => {
      peopleRefetch();
    }, THREE_HOURS);

    return () => clearInterval(interval);
  }, [peopleRefetch]);
}
