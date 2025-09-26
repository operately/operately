import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as React from "react";

import { useProfileUpdatedSignal } from "@/signals";
import { throttle } from "@/utils/throttle";

import { usePaths } from "@/routes/paths";
import { useParams } from "react-router-dom";

interface CurrentCompanyContextProps {
  company: Companies.Company | null;
  me: People.Person | null;

  people: People.Person[] | null;
  peopleLoading: boolean;
  peopleRefetch: () => void;
}

const CurrentCompanyContext = React.createContext<CurrentCompanyContextProps | null>(null);

export function CurrentCompanyProvider({ children }) {
  const params = useParams();
  const company = Companies.useGetCompany({ id: params.companyId });

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
    company: company?.data?.company || null,
  };

  if (!ctx.me) return null;

  return <CurrentCompanyContext.Provider value={ctx}>{children}</CurrentCompanyContext.Provider>;
}

export function useMe(): People.Person | null {
  const ctx = React.useContext(CurrentCompanyContext);
  if (!ctx) return null;

  return ctx.me;
}

export function useCurrentCompany(): Companies.Company | null {
  const ctx = React.useContext(CurrentCompanyContext);
  if (!ctx) return null;

  return ctx.company;
}

export function useMentionedPersonLookupFn(): (
  id: string,
) => Promise<(People.Person & { profileLink: string }) | null> {
  const paths = usePaths();
  const ctx = React.useContext(CurrentCompanyContext);
  if (!ctx) {
    return async () => null;
  }

  if (ctx.peopleLoading) {
    return async () => null;
  }

  return async (id: string) => {
    const person = ctx.people?.find((p) => p.id === id);
    if (person) {
      return { ...person, profileLink: paths.profilePath(person.id) };
    }
    ctx.peopleRefetch();
    return null;
  };
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
