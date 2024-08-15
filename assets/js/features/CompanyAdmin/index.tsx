export function createInvitationUrl(token: string) {
  const url = `${window.location.protocol}//${window.location.host}`;
  const route = "/join";
  const queryString = "?token=" + token;

  return url + route + queryString;
}
