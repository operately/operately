import * as api from "@/api";

export type Company = api.Company;

export {
  getCompany,
  useAddCompanyOwners,
  useRemoveCompanyOwner,
  useEditCompany,
  useGetCompany,
  useAddCompanyTrustedEmailDomain,
  useRemoveCompanyTrustedEmailDomain,
  useRemoveCompanyAdmin,
  useAddCompanyAdmins,
  useRemoveCompanyMember,
  useAddFirstCompany,
  useAddCompanyMember,
  useNewInvitationToken,
  useRestoreCompanyMember,
} from "@/api";

export function createInvitationUrl(token: string) {
  return `${window.location.protocol}//${window.location.host}/join?token=${token}`;
}

export function hasFeature(company: Company, feature: string) {
  return company.enabledExperimentalFeatures.includes(feature);
}
