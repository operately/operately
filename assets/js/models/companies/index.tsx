export type { Company } from "@/gql/generated";

export { getCompany, useCompany } from "./getCompany";
export { useAddTrustedEmailDomainMutation } from "./useAddTrustedEmailMutation";
export { useRemoveTrustedEmailDomainMutation } from "./useRemoveTrustedEmailMutation";
export { useRemoveAdminMutation } from "./useRemoveAdminMutation";
export { useAddAdminsMutation } from "./useAddAdminsMutation";
export { useRemoveMemberMutation } from "./useRemoveMemberMutation";
export { useAddFirstCompanyMutation } from "./useAddFirstCompanyMutation";

import { Company } from "@/gql/generated";

export function hasFeature(company: Company, feature: string): boolean {
  return company.enabledExperimentalFeatures!.includes(feature);
}
