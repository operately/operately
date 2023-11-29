import * as React from "react";

import { Company, Person } from "@/gql/generated";
import { useRefresh, useLoadedData } from "./loader";

import * as Companies from "@/models/companies";

export interface FormState {
  me: Person;
  company: Company;

  addAdmins: (peopleIds: string[]) => Promise<void>;
  removeAdmin: (personId: string) => Promise<void>;
}

export function useFrom(): FormState {
  const { me, company } = useLoadedData();
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

  const [remove] = Companies.useRemoveAdminMutation({
    onCompleted: refresh,
  });

  return React.useCallback(async (personId: string) => {
    await remove({
      variables: {
        personId,
      },
    });
  }, []);
}

function useAddAdmins() {
  const refresh = useRefresh();

  const [remove] = Companies.useAddAdminsMutation({
    onCompleted: refresh,
  });

  return React.useCallback(async (peopleIds: string[]) => {
    await remove({
      variables: {
        peopleIds,
      },
    });
  }, []);
}
