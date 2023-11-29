import * as React from "react";
import * as Companies from "@/models/companies";

import { useRefresh } from "./loader";

export interface FormState {
  domains: string[];
  addDomain: (domain: string) => Promise<void>;
  removeDomain: (domain: string) => Promise<void>;
}

export function useForm({ company }): FormState {
  const refresh = useRefresh();

  const [add] = Companies.useAddTrustedEmailDomainMutation({
    onCompleted: () => refresh(),
  });

  const [remove] = Companies.useRemoveTrustedEmailDomainMutation({
    onCompleted: () => refresh(),
  });

  const addDomain = React.useCallback(
    async (domain: string) => {
      if (domain.length === 0) return;
      if (company.trustedEmailDomains!.includes(domain)) return;

      await add({
        variables: {
          companyID: company.id,
          domain,
        },
      });
    },
    [company],
  );

  const removeDomain = React.useCallback(
    async (domain: string) => {
      await remove({
        variables: {
          companyID: company.id,
          domain,
        },
      });
    },
    [company],
  );

  return {
    domains: company.trustedEmailDomains!,
    addDomain,
    removeDomain,
  };
}
