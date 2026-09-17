import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { companyInviteLinkQueryOptions, fetchCompanyInviteLink } from "@/models/invitations";

export async function loader() {
  const queryInput = {};
  await fetchCompanyInviteLink(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(companyInviteLinkQueryOptions(queryInput));

  if (!data?.inviteLink) throw new Error("Company invite link is unavailable");

  return { link: data.inviteLink };
}
