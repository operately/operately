import * as React from "react";
import * as Companies from "@/models/companies";

export interface FormState {
  domains: string[];
  addDomain: (domain: string) => Promise<void>;
  removeDomain: (domain: string) => Promise<void>;
}

export function useForm({ company }): FormState {
  const { mutateAsync: add } = Companies.useAddCompanyTrustedEmailDomain();
  const { mutateAsync: remove } = Companies.useRemoveCompanyTrustedEmailDomain();

  const addDomain = React.useCallback(
    async (domain: string) => {
      if (domain.length === 0) return;
      if ((company.trustedEmailDomains ?? []).includes(domain)) return;

      await add({ companyId: company.id, domain });
    },
    [company, add],
  );

  const removeDomain = React.useCallback(
    async (domain: string) => {
      await remove({ companyId: company.id, domain });
    },
    [company, remove],
  );

  return {
    domains: company.trustedEmailDomains ?? [],
    addDomain,
    removeDomain,
  };
}
