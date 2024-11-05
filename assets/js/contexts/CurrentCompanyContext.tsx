import * as React from "react";
import * as People from "@/models/people";

import { useProfileUpdatedSignal } from "@/signals";
import { assertPresent } from "@/utils/assertions";

interface CurrentCompanyContextProps {
  me: People.Person | null;

  people: People.Person[] | null;
  peopleLoading: boolean;
}

const CurrentCompanyContext = React.createContext<CurrentCompanyContextProps | null>(null);

export function CurrentCompanyProvider({ children }) {
  const { data: meData, refetch: meRefetch } = People.useGetMe({ includeManager: true });
  const { data: peopleData, loading: peopleLoading } = People.useGetPeople({ includeSuspended: true });

  useProfileUpdatedSignal(meRefetch);

  const ctx = {
    me: meData?.me || null,
    people: peopleData?.people?.map((p) => p!) || null,
    peopleLoading,
  };

  if (!ctx.me) return null;

  return <CurrentCompanyContext.Provider value={ctx}>{children}</CurrentCompanyContext.Provider>;
}

export function useMe(): People.Person | null {
  const ctx = React.useContext(CurrentCompanyContext);
  if (!ctx) return null;

  return ctx.me;
}

export function usePersonAvatar(id: string): { avatar: string; loading: boolean } {
  const ctx = React.useContext(CurrentCompanyContext);
  if (!ctx) return { avatar: "", loading: true };
  if (ctx.peopleLoading) return { avatar: "", loading: true };

  assertPresent(ctx.people, "people must be present if peopleLoading is false");

  const person = ctx.people.find((p) => p.id === id);
  if (!person) return { avatar: "", loading: true };

  return { avatar: person!.avatarUrl!, loading: false };
}
