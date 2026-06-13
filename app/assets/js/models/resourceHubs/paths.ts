import type { Paths } from "@/routes/paths";
import type { ResourceHubNavigationPaths, ResourceHubNodesListPaths } from "turboui";

// Bind Paths methods so they can be passed as callbacks without losing `this`.
export function resourceHubNavigationPaths(paths: Paths): ResourceHubNavigationPaths {
  return {
    projectPath: (id) => paths.projectPath(id),
    spacePath: (id) => paths.spacePath(id),
    resourceHubPath: (id) => paths.resourceHubPath(id),
    resourceHubFolderPath: (id) => paths.resourceHubFolderPath(id),
  };
}

export function resourceHubListPaths(paths: Paths): ResourceHubNodesListPaths {
  return {
    editDocumentPath: (id) => paths.resourceHubEditDocumentPath(id),
    editFilePath: (id) => paths.resourceHubEditFilePath(id),
    editLinkPath: (id) => paths.resourceHubEditLinkPath(id),
    documentPath: (id) => paths.resourceHubDocumentPath(id),
    folderPath: (id) => paths.resourceHubFolderPath(id),
  };
}
