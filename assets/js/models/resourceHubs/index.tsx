import { ResourceHubNode, ResourceHubFile, ResourceHubFolder, ResourceHubDocument, ResourceHubLink } from "@/api";
import { assertPresent } from "@/utils/assertions";

export type {
  ResourceHub,
  ResourceHubNode,
  ResourceHubDocument,
  ResourceHubPermissions,
  ResourceHubFolder,
  ResourceHubFile,
  ResourceHubLink,
} from "@/api";

export {
  getResourceHub,
  getResourceHubDocument,
  getResourceHubFile,
  getResourceHubFolder,
  getResourceHubLink,
  useCreateResourceHubFolder,
  useCreateResourceHubDocument,
  useCreateResourceHubFile,
  useCreateResourceHubLink,
  useEditParentFolderInResourceHub,
  useEditResourceHubDocument,
  useEditResourceHubFile,
  useEditResourceHubLink,
  useDeleteResourceHubDocument,
  useDeleteResourceHubFile,
  useDeleteResourceHubFolder,
  useDeleteResourceHubLink,
  useRenameResourceHubFolder,
} from "@/api";

export type Resource = ResourceHubDocument | ResourceHubFile | ResourceHubFolder | ResourceHubLink;
export type ResourceTypeName = "document" | "file" | "folder" | "link";

export function isDocument(node: ResourceHubNode): boolean {
  return node.type === "document";
}

export function isFolder(node: ResourceHubNode): boolean {
  return node.type === "folder";
}

export function isLink(node: ResourceHubNode): boolean {
  return node.type === "link";
}

function isFile(node: ResourceHubNode): boolean {
  return node.type === "file";
}

export function isImage(node: ResourceHubNode): boolean {
  return isFile(node) && hasContentType(node, "image");
}

export function hasContentType(node: ResourceHubNode, contentType: string): boolean {
  assertPresent(node.file?.blob, "file.blob must be present in node");

  return (isFile(node) && node.file.blob.contentType?.includes(contentType)) || false;
}
