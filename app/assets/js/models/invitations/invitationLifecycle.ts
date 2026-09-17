import Api from "@/api";
import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { companyInviteLinkQueryKeyPrefix, companyInviteLinkQueryOptions } from "./invitationQueries";

function invalidateCompanyInviteLinkQueries(client: QueryClient) {
  return Promise.all([
    client.invalidateQueries({ queryKey: companyInviteLinkQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.invitations.getInviteLinkAvailabilityQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.invitations.getInviteLinkByTokenQueryKeyPrefix() }),
  ]);
}

export function useUpdateCompanyInviteLink() {
  const client = useQueryClient();

  return useMutation({
    ...Api.invitations.updateCompanyInviteLinkMutationOptions(),
    onSuccess: ({ inviteLink }) => {
      if (inviteLink) client.setQueryData(companyInviteLinkQueryOptions({}).queryKey, () => ({ inviteLink }));
      return invalidateCompanyInviteLinkQueries(client);
    },
  });
}

export function useResetCompanyInviteLink() {
  const client = useQueryClient();

  return useMutation({
    ...Api.invitations.resetCompanyInviteLinkMutationOptions(),
    onSuccess: ({ inviteLink }) => {
      if (inviteLink) client.setQueryData(companyInviteLinkQueryOptions({}).queryKey, () => ({ inviteLink }));
      return invalidateCompanyInviteLinkQueries(client);
    },
  });
}

// Both join flows leave the app with a full-page login or company redirect.
export function useJoinCompany() {
  return useMutation(Api.joinCompanyMutationOptions());
}

export function useJoinCompanyViaInviteLink() {
  return useMutation(Api.invitations.joinCompanyViaInviteLinkMutationOptions());
}
