import * as api from "@/api";

export { getInviteLink, listInviteLinks, createInviteLink, revokeInviteLink, joinCompanyViaInviteLink } from "@/api";

export type InviteLink = api.InviteLink;

export function createInvitationUrl(token: string): string {
  const companyId = window.appConfig?.companyId || "";
  return `${window.location.origin}/${companyId}/join/${token}`;
}