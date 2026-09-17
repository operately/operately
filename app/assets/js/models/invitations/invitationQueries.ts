import Api, { type InvitationsGetCompanyInviteLinkInput, type InvitationsGetInviteLinkAvailabilityInput } from "@/api";
import { queryClient } from "@/api/queryClient";
import { queryOptions } from "@tanstack/react-query";

/** Recheck capacity and link validity on every visit, including "Try again". */
export function fetchInviteLinkAvailability(input: InvitationsGetInviteLinkAvailabilityInput) {
  return queryClient.fetchQuery({
    ...Api.invitations.getInviteLinkAvailabilityQueryOptions(input),
    staleTime: 0,
  });
}

export function fetchCompanyInviteLink(input: InvitationsGetCompanyInviteLinkInput) {
  return queryClient.fetchQuery({ ...companyInviteLinkQueryOptions(input), staleTime: Infinity });
}

export function companyInviteLinkQueryKeyPrefix() {
  return [
    "operately-api",
    Api.default.getBasePath(),
    Api.default.getHeaders(),
    "/invitations/get_company_invite_link",
  ] as const;
}

/** This get-or-create endpoint is a POST, so it has no generated query helpers. */
export function companyInviteLinkQueryOptions(input: InvitationsGetCompanyInviteLinkInput) {
  return queryOptions({
    queryKey: [...companyInviteLinkQueryKeyPrefix(), input],
    queryFn: () => Api.invitations.getCompanyInviteLink(input),
  });
}
