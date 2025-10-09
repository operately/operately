import * as api from "@/api";

export type Company = api.Company;
export { hasFeature } from "./hasFeature";

export {
  completeCompanySetup,
  getCompany,
  useAddCompanyAdmins,
  useAddCompanyMember,
  useAddCompanyOwners,
  useAddCompanyTrustedEmailDomain,
  useAddFirstCompany,
  useCompleteCompanySetup,
  useEditCompany,
  useGetCompany,
  useRemoveCompanyAdmin,
  useRemoveCompanyMember,
  useRemoveCompanyOwner,
  useRemoveCompanyTrustedEmailDomain,
  useRestoreCompanyMember,
} from "@/api";

// Individual invitations
export function createInvitationUrl(token: string) {
  return `${window.location.protocol}//${window.location.host}/join?token=${token}`;
}

// Bulk invitations
export function createBulkInvitationUrl(token: string) {
  return `${window.location.protocol}//${window.location.host}/join/${token}`;
}
