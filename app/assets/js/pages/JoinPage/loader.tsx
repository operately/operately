import Api from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { redirect } from "react-router";

export async function loader({ request }: { request: Request }) {
  const token = Pages.getSearchParam(request, "token");
  if (!token) return redirect("/");

  const queryInput = { token };
  // Invitations can expire or be revoked between visits.
  const { inviteLink } = await queryClient.fetchQuery({
    ...Api.invitations.getInvitationQueryOptions(queryInput),
    staleTime: 0,
  });
  if (!inviteLink) return redirect("/");

  return { queryInput };
}

type LoaderResult = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.invitations.getInvitationQueryOptions(queryInput));

  // Login clears the cache before the browser finishes its full-page redirect.
  if (!data) return null;
  if (!data.inviteLink || !data.member) throw new Error("Invitation is unavailable");

  return { inviteLink: data.inviteLink, member: data.member, token: queryInput.token };
}
