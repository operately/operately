import * as React from "react";

import { Company, Person } from "@/gql/generated";
import { useRefresh, useLoadedData } from "./loader";

import * as Companies from "@/models/companies";

export interface FormState {
  me: Person;
  company: Company;
  removeAdmin: (personId: string) => Promise<void>;
}

export function useFrom(): FormState {
  const refresh = useRefresh();

  const { me, company } = useLoadedData();

  const [remove] = Companies.useRemoveAdminMutation({
    onCompleted: refresh,
  });

  const removeAdmin = React.useCallback(async (personId: string) => {
    await remove({
      variables: {
        personId,
      },
    });
  }, []);

  return {
    me,
    company,
    removeAdmin,
  };
}
