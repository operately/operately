import Api from "@/api";
import * as api from "@/api";

export type Company = api.Company;
export { hasFeature } from "./hasFeature";

export {
  completeCompanySetup,
  useAddCompanyOwners,
  useAddCompanyTrustedEmailDomain,
  useAddFirstCompany,
  useCompleteCompanySetup,
  useDeleteCompany,
} from "@/api";

export const getCompany = Api.companies.get;
export const useAddCompanyAdmins = Api.companies.useCreateAdmins;
export const useAddCompanyMember = Api.companies.useCreateMember;
export const useEditCompany = Api.companies.useUpdate;
export const useGetCompany = Api.companies.useGet;
export const useRemoveCompanyAdmin = Api.companies.useDeleteAdmin;
export const useRemoveCompanyMember = Api.companies.useDeleteMember;
export const useRemoveCompanyOwner = Api.companies.useDeleteOwner;
export const useRemoveCompanyTrustedEmailDomain = Api.companies.useDeleteTrustedEmailDomain;
export const useRestoreCompanyMember = Api.companies.useRestoreMember;

// Individual invitations
export function createInvitationUrl(token: string) {
  return `${window.location.protocol}//${window.location.host}/join?token=${token}`;
}

// Bulk invitations
export function createBulkInvitationUrl(token: string) {
  return `${window.location.protocol}//${window.location.host}/join/${token}`;
}
