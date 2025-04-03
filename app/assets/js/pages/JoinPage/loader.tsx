import { redirect } from "react-router-dom";
import * as Pages from "@/components/Pages";
import * as Invitations from "@/models/invitations";

interface LoaderResult {
  invitation: Invitations.Invitation;
  token: string;
  resetPassword: boolean;
}

export async function loader({ request }) {
  const token = Pages.getSearchParam(request, "token");
  if (!token) return redirect("/");

  const { invitation, resetPassword } = await Invitations.getInvitation({ token: token });
  if (!invitation) return redirect("/");

  return { invitation, token, resetPassword };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
