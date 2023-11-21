import { ProjectKeyResource } from "@/gql/generated";

export { useRemoveResource } from "./useRemoveResource";
export { useAddResource } from "./useAddResource";

export type KeyResource = ProjectKeyResource;

export const SupportedTypes = [
  "slack-channel",
  "github-repository",
  "google-document",
  "google-sheet",
  "basecamp-project",
  "generic",
];

const HumanTitles = {
  "slack-channel": "Slack Channel",
  "github-repository": "Github Repository",
  "google-document": "Google Document",
  "google-sheet": "Google Sheet",
  "basecamp-project": "Basecamp Project",
  generic: "Link",
};

const PlaceholderNames = {
  "slack-channel": "e.g. #new-website",
  "github-repository": "Github Repo",
  "google-document": "Google Doc",
  "google-sheet": "Google Sheet",
  "basecamp-project": "Basecamp Project",
  generic: "e.g. Website Link",
};

export function humanTitle(type: string) {
  return fetchOrError(HumanTitles, type);
}

export function placeholderName(type: string) {
  return fetchOrError(PlaceholderNames, type);
}

function fetchOrError(map: Record<string, string>, key: string) {
  const value = map[key];
  if (!value) throw new Error(`Unknown resource type: ${key}`);
  return value;
}
