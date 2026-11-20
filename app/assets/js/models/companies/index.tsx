import * as api from "@/api";
import { useQuery } from "@tanstack/react-query";

export type Company = api.Company;
export { useLoadCollaboratorResources } from "./useLoadCollaboratorResources";

export function useCompanies() {
  return useQuery(api.default.companies.listQueryOptions({}));
}

export { useAddFirstCompany } from "@/api";

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
