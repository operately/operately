import { ResourceHub } from "@/models/resourceHubs";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

type NavigationItem = {
  to: string;
  label: string;
};

export function resourceHubParentItem(paths: Paths, resourceHub: ResourceHub): NavigationItem {
  if (resourceHub.project) {
    assertPresent(resourceHub.project.id, "project.id must be present in resourceHub");
    assertPresent(resourceHub.project.name, "project.name must be present in resourceHub");

    return {
      to: paths.projectPath(resourceHub.project.id),
      label: resourceHub.project.name,
    };
  }

  if (resourceHub.space) {
    assertPresent(resourceHub.space.id, "space.id must be present in resourceHub");
    assertPresent(resourceHub.space.name, "space.name must be present in resourceHub");

    return {
      to: paths.spacePath(resourceHub.space.id),
      label: resourceHub.space.name,
    };
  }

  throw new Error("space or project must be present in resourceHub");
}
