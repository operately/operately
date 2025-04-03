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

  const [add] = Companies.useAddCompanyTrustedEmailDomain();
  const [remove] = Companies.useRemoveCompanyTrustedEmailDomain();

  const addDomain = React.useCallback(
    async (domain: string) => {
      if (domain.length === 0) return;
      if (company.trustedEmailDomains!.includes(domain)) return;

      await add({ companyId: company.id, domain });

      refresh();
    },
    [company],
  );

  const removeDomain = React.useCallback(
    async (domain: string) => {
      await remove({ companyId: company.id, domain });

      refresh();
    },
    [company],
  );

  return {
    domains: company.trustedEmailDomains!,
    addDomain,
    removeDomain,
  };
}
