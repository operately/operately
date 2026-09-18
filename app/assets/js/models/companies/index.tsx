import Api from "@/api";
import * as api from "@/api";

export type Company = api.Company;
export { hasFeature } from "./hasFeature";
export { useLoadCollaboratorResources } from "./useLoadCollaboratorResources";

export { completeCompanySetup, useAddFirstCompany, useCompleteCompanySetup } from "@/api";

export const getCompany = Api.companies.get;

// Individual invitations
export function createInvitationUrl(token: string) {
  return `${window.location.protocol}//${window.location.host}/join?token=${token}`;
}

export {
  useCreateCompany,
  useEditCompany,
  useAddCompanyTrustedEmailDomain,
  useRemoveCompanyTrustedEmailDomain,
  useDeleteCompany,
} from "./companyLifecycle";
export {
  useAddCompanyAdmins,
  useAddCompanyOwners,
  useRemoveCompanyAdmin,
  useRemoveCompanyOwner,
  useAddCompanyMember,
  useRemoveCompanyMember,
  useRestoreCompanyMember,
  useInviteGuest,
  useConvertMemberToGuest,
  useUpdateMembersPermissions,
  useNewInvitationToken,
} from "./companyMembershipLifecycle";
