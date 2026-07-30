import type { SearchResult } from "@/api";
import { Paths } from "@/routes/paths";

export function searchResultPath(paths: Paths, result: SearchResult): string | null {
  const target = result.navigationTarget;

  switch (result.type) {
    case "resource_hub_folder":
      return target.folderId ? paths.resourceHubFolderPath(target.folderId) : null;
    case "resource_hub_document":
      return target.documentId ? paths.resourceHubDocumentPath(target.documentId) : null;
    case "resource_hub_file":
      return target.fileId ? paths.resourceHubFilePath(target.fileId) : null;
    case "resource_hub_link":
      return target.linkId ? paths.resourceHubLinkPath(target.linkId) : null;
    case "project":
      return target.projectId ? paths.projectPath(target.projectId) : null;
    case "goal":
      return target.goalId ? paths.goalPath(target.goalId) : null;
    case "discussion":
      return target.discussionId ? paths.discussionPath(target.discussionId) : null;
    case "project_check_in":
      return target.projectCheckInId ? paths.projectCheckInPath(target.projectCheckInId) : null;
    case "goal_check_in":
      return target.goalCheckInId ? paths.goalCheckInPath(target.goalCheckInId) : null;
    case "project_retrospective":
      return target.projectId ? paths.projectRetrospectivePath(target.projectId) : null;
  }
}
