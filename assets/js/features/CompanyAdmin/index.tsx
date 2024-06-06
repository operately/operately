export { InvitationUrl } from "./InvitationUrl";


export function createInvitationUrl(token: string) {
  const url = `${window.location.protocol}//${window.location.host}`;
  const route = "/first-time-login";
  const queryString = "?token=" + token;

  return url + route + queryString;
}