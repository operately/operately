import * as api from "@/api";

export type Company = api.Company;
export { hasFeature } from "./hasFeature";

export {
  getCompany,
  useAddCompanyAdmins,
  useAddCompanyMember,
  useAddCompanyOwners,
  useAddCompanyTrustedEmailDomain,
  useAddFirstCompany,
  completeCompanySetup,
  useCompleteCompanySetup,
  useEditCompany,
  useGetCompany,
  useRemoveCompanyAdmin,
  useRemoveCompanyMember,
  useRemoveCompanyOwner,
  useRemoveCompanyTrustedEmailDomain,
  useRestoreCompanyMember,
} from "@/api";

export function createInvitationUrl(token: string) {
  return `${window.location.protocol}//${window.location.host}/join?token=${token}`;
}
