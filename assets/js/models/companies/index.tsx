export type { Company } from "@/gql/generated";

export { getCompany } from "./getCompany";
export { useAddTrustedEmailDomainMutation } from "./useAddTrustedEmailMutation";
export { useRemoveTrustedEmailDomainMutation } from "./useRemoveTrustedEmailMutation";
export { useRemoveAdminMutation } from "./useRemoveAdminMutation";
export { useAddAdminsMutation } from "./useAddAdminsMutation";

import { Company } from "@/gql/generated";

export function hasFeature(company: Company, feature: string): boolean {
  return company.enabledExperimentalFeatures!.includes(feature);
}
