import { ResourceHubFile, ResourceHubFolder, ResourceHubDocument, ResourceHubLink } from "@/api";

import Api from "@/api";
export type {
  ResourceHub,
  ResourceHubNode,
  ResourceHubDocument,
  ResourceHubPermissions,
  ResourceHubFolder,
  ResourceHubFile,
  ResourceHubLink,
} from "@/api";

export { resourceHubListPaths, resourceHubNavigationPaths } from "./paths";
export { getDraftEditPath, getNodePath } from "./nodeUtils";
export { useNewFileModalsContextValue } from "./useNewFileModalsContextValue";
export { useResourceHubNodesListContext, type NodesProps } from "./useResourceHubNodesListContext";
export { useResourceHubNodesListProps } from "./useResourceHubNodesListProps";
export { useCopyDocumentListContext } from "./useCopyDocumentListContext";
export { useAddFileWidgetProps } from "./useAddFileWidgetProps";
export const resource_hubs = Api.resource_hubs;
export const documents = Api.documents;
export const files = Api.files;
export const folders = {
  get: Api.resource_hubs.getFolder,
  useCopy: Api.resource_hubs.useCopyFolder,
  useCreate: Api.resource_hubs.useCreateFolder,
  useDelete: Api.resource_hubs.useDeleteFolder,
  useRename: Api.resource_hubs.useRenameFolder,
};
export const links = Api.links;

export type Resource = ResourceHubDocument | ResourceHubFile | ResourceHubFolder | ResourceHubLink;
export type ResourceTypeName = "document" | "file" | "folder" | "link";
