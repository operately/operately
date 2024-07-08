import * as api from "@/api";

export type Company = api.Company;

export { getCompany } from "@/api";

export { useAddTrustedEmailDomainMutation } from "./useAddTrustedEmailMutation";
export { useRemoveTrustedEmailDomainMutation } from "./useRemoveTrustedEmailMutation";
export { useRemoveAdminMutation } from "./useRemoveAdminMutation";
export { useAddAdminsMutation } from "./useAddAdminsMutation";
export { useRemoveMemberMutation } from "./useRemoveMemberMutation";
export { useAddFirstCompanyMutation } from "./useAddFirstCompanyMutation";

export function hasFeature(company: Company, feature: string): boolean {
  return company.enabledExperimentalFeatures!.includes(feature);
}
