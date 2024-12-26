export type {
  ResourceHub,
  ResourceHubNode,
  ResourceHubDocument,
  ResourceHubPermissions,
  ResourceHubFolder,
  ResourceHubFile,
} from "@/api";
export {
  getResourceHub,
  getResourceHubDocument,
  getResourceHubFile,
  getResourceHubFolder,
  useCreateResourceHubFolder,
  useCreateResourceHubDocument,
  useCreateResourceHubFile,
  useCreateResourceHubLink,
  useEditParentFolderInResourceHub,
  useEditResourceHubDocument,
  useEditResourceHubFile,
  useDeleteResourceHubDocument,
  useDeleteResourceHubFile,
  useDeleteResourceHubFolder,
  useRenameResourceHubFolder,
} from "@/api";

import { ResourceHubNode } from "@/api";
import { assertPresent } from "@/utils/assertions";

export function isDocument(node: ResourceHubNode): boolean {
  return node.type === "document";
}

export function isFolder(node: ResourceHubNode): boolean {
  return node.type === "folder";
}

export function isFile(node: ResourceHubNode): boolean {
  return node.type === "file";
}

export function isImage(node: ResourceHubNode): boolean {
  return isFile(node) && hasContentType(node, "image");
}

export function hasContentType(node: ResourceHubNode, contentType: string): boolean {
  assertPresent(node.file?.blob, "file.blob must be present in node");

  return (isFile(node) && node.file.blob.contentType?.includes(contentType)) || false;
}
