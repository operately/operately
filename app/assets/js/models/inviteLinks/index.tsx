import * as api from "@/api";

export type InviteLink = api.InviteLink;

export function createInvitationUrl(token: string): string {
  return `${window.location.origin}/join/${token}`;
}
