import Api from "@/api";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

async function invalidateCompanyMembershipQueries(client: QueryClient) {
  const prefixes = [
    Api.companies.getQueryKeyPrefix(),
    Api.spaces.countByAccessLevelQueryKeyPrefix(),
    Api.companies.listQueryKeyPrefix(),
    Api.people.listQueryKeyPrefix(),
    Api.people.getQueryKeyPrefix(),
    Api.people.getMeQueryKeyPrefix(),
    Api.billing.getQueryKeyPrefix(),
    Api.billing.getAccessStateQueryKeyPrefix(),
  ];
  await Promise.all(prefixes.map((queryKey) => client.invalidateQueries({ queryKey })));
}

export function useAddCompanyAdmins() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.createAdminsMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useAddCompanyOwners() {
  const client = useQueryClient();
  return useMutation({
    ...Api.addCompanyOwnersMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useRemoveCompanyAdmin() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.deleteAdminMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useRemoveCompanyOwner() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.deleteOwnerMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useAddCompanyMember() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.createMemberMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useRemoveCompanyMember() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.deleteMemberMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useRestoreCompanyMember() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.restoreMemberMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useInviteGuest() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.inviteGuestMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useConvertMemberToGuest() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.convertMemberToGuestMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useUpdateMembersPermissions() {
  const client = useQueryClient();
  return useMutation({
    ...Api.companies.updateMembersPermissionsMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}

export function useNewInvitationToken() {
  const client = useQueryClient();
  return useMutation({
    ...Api.invitations.newInvitationTokenMutationOptions(),
    onSuccess: () => invalidateCompanyMembershipQueries(client),
  });
}
