import * as api from "@/api";

import { projectLink, spaceLink } from "./feedItemLinks";

type ResourceHubActivityContext = {
  project?: api.Project | null;
  space?: api.Space | null;
};

export function resourceHubParentScope(
  data: ResourceHubActivityContext,
  page: string,
  suffix: "" | ":" = "",
): (string | JSX.Element)[] {
  if (page === "project" || page === "space") return [];

  if (data.project) {
    return ["in the", projectLink(data.project), `project${suffix}`];
  }

  if (data.space) {
    return ["in the", spaceLink(data.space), `space${suffix}`];
  }

  return [];
}
