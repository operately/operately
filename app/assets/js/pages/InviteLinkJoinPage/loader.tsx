import Api, { type InvitationsGetInviteLinkAvailabilityInput } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { fetchInviteLinkAvailability } from "@/models/invitations";
import { Paths } from "@/routes/paths";
import { redirect } from "react-router";
import { type InviteLinkJoinPage } from "turboui";

interface LoaderResult {
  queryInput: InvitationsGetInviteLinkAvailabilityInput | null;
  token?: string;
}

export async function loader({ params }: { params: { token?: string } }): Promise<LoaderResult | Response> {
  const token = params.token;
  if (!token) return redirect("/");

  const queryInput = { token };
  try {
    const { inviteLink, memberLimitExceeded } = await fetchInviteLinkAvailability(queryInput);
    if (inviteLink?.isActive && memberLimitExceeded) return redirect(Paths.inviteJoinFullPath(token));

    return { queryInput };
  } catch {
    return { queryInput: null, token };
  }
}

export function useLoadedData() {
  const { queryInput, token: failedToken } = Pages.useLoadedData<LoaderResult>();
  const token = queryInput?.token ?? failedToken ?? "";
  const { data } = useLoadedQuery({
    ...Api.invitations.getInviteLinkAvailabilityQueryOptions({ token }),
    enabled: queryInput !== null,
  });
  const invite = queryInput ? (data?.inviteLink ?? null) : null;

  const pageState: InviteLinkJoinPage.PageState = !invite?.isActive
    ? "invalid-token"
    : window.appConfig.account?.id
      ? "logged-in-user-valid-token"
      : "anonymous-user-valid-token";

  return { invite, token, pageState };
}
