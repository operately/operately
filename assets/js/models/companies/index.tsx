import * as api from "@/api";

export type Company = api.Company;

export {
  getCompany,
  useAddCompanyTrustedEmailDomain,
  useRemoveCompanyTrustedEmailDomain,
  useRemoveCompanyAdmin,
  useAddCompanyAdmins,
  useRemoveCompanyMember,
  useAddFirstCompany,
  useAddCompanyMember,
  useNewInvitationToken,
} from "@/api";

export function hasFeature(company: Company, feature: string): boolean {
  return company.enabledExperimentalFeatures!.includes(feature);
}

export function createInvitationUrl(token: string) {
  return `${window.location.protocol}//${window.location.host}/join?token=${token}`;
}
