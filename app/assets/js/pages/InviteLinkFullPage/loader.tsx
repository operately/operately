import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { fetchInviteLinkAvailability } from "@/models/invitations";
import { Paths } from "@/routes/paths";
import { redirect } from "react-router";

export async function loader({ params }: { params: { token?: string } }) {
  const token = params.token;
  if (!token) return redirect("/");

  const queryInput = { token };
  try {
    const { memberLimitExceeded } = await fetchInviteLinkAvailability(queryInput);
    if (!memberLimitExceeded) return redirect(Paths.inviteJoinPath(token));

    return { queryInput };
  } catch {
    return redirect(Paths.inviteJoinPath(token));
  }
}

type LoaderResult = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.invitations.getInviteLinkAvailabilityQueryOptions(queryInput));

  if (!data) throw new Error("Invite availability is unavailable");

  return { invite: data.inviteLink ?? null, token: queryInput.token };
}
