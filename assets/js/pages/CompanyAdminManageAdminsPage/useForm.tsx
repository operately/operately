import * as React from "react";
import * as People from "@/models/people";
import * as Companies from "@/models/companies";

import { useRefresh, useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentUserContext";

export interface FormState {
  me: People.Person;
  company: Companies.Company;

  addAdmins: (peopleIds: string[]) => Promise<void>;
  removeAdmin: (personId: string) => Promise<void>;
}

export function useFrom(): FormState {
  const me = useMe()!;
  const { company } = useLoadedData();
  const removeAdmin = useRemoveAdmin();
  const addAdmins = useAddAdmins();

  return {
    me,
    company,
    addAdmins,
    removeAdmin,
  };
}

function useRemoveAdmin() {
  const refresh = useRefresh();

  const [remove] = Companies.useRemoveCompanyAdmin();

  return React.useCallback(async (personId: string) => {
    await remove({ personId });
    refresh();
  }, []);
}

function useAddAdmins() {
  const refresh = useRefresh();

  const [remove] = Companies.useAddCompanyAdmins();

  return React.useCallback(async (peopleIds: string[]) => {
    await remove({ peopleIds });
    refresh();
  }, []);
}
