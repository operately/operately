import { redirect } from "react-router-dom";

import * as Pages from "@/components/Pages";
import * as Invitations from "@/models/invitations";

interface LoaderResult {
  invitation: Invitations.Invitation;
  token: string;
}

export async function loader({ request }): Promise<any> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) return redirect("/");

  const invitation = await Invitations.getInvitation({ token: token });

  if (!invitation) return redirect("/");

  return { invitation, token };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
