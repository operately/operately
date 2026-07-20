import { richContentToString } from "../RichContent";
import type {
  FolderSelectCurrentLocation,
  ResourceHubDocument,
  ResourceHubFile,
  ResourceHubFolder,
  ResourceHubLink,
  ResourceHubNode,
  ResourceHubNodeType,
  ResourceHubResource,
} from "./types";

export function getNodeType(node: ResourceHubNode): ResourceHubNodeType | null {
  if (node.type === "document" || node.type === "folder" || node.type === "file" || node.type === "link") {
    return node.type;
  }

  if (node.document) return "document";
  if (node.folder) return "folder";
  if (node.file) return "file";
  if (node.link) return "link";

  return null;
}

export function getNodeId(node: ResourceHubNode): string | null {
  return node.id ?? getResourceId(getNodeResource(node));
}

export function getNodeName(node: ResourceHubNode): string {
  if (node.document?.name) return node.document.name;
  return node.name ?? getResourceName(getNodeResource(node));
}

export function getNodeCommentsCount(node: ResourceHubNode): number {
  if (node.document?.commentsCount !== undefined && node.document.commentsCount !== null) return node.document.commentsCount;
  if (node.file?.commentsCount !== undefined && node.file.commentsCount !== null) return node.file.commentsCount;
  if (node.link?.commentsCount !== undefined && node.link.commentsCount !== null) return node.link.commentsCount;
  return 0;
}

export function getNodeAuthorName(node: ResourceHubNode): string | null {
  if (node.document?.author?.fullName) return node.document.author.fullName;
  if (node.file?.author?.fullName) return node.file.author.fullName;
  if (node.link?.author?.fullName) return node.link.author.fullName;
  return null;
}

export function getNodeChildrenCount(node: ResourceHubNode): number | null {
  return node.folder?.childrenCount ?? null;
}

export function getNodeFileSize(node: ResourceHubNode): number | null {
  return node.file?.size ?? null;
}

export function getNodeDescription(node: ResourceHubNode): string | null {
  if (node.document?.content) return richTextToPlainText(node.document.content);
  if (node.file?.description) return richTextToPlainText(node.file.description);
  return null;
}

export function getNodeLinkType(node: ResourceHubNode) {
  return node.link?.type ?? null;
}

export function getNodeContentType(node: ResourceHubNode): string | null {
  return node.file?.blob?.contentType ?? null;
}

export function hasNodeContentType(node: ResourceHubNode, contentType: string): boolean {
  return getNodeType(node) === "file" && Boolean(getNodeContentType(node)?.includes(contentType));
}

export function isNodeMovFile(node: ResourceHubNode): boolean {
  const contentType = getNodeContentType(node);

  return getNodeType(node) === "file" && Boolean(contentType && (contentType.includes("quicktime") || contentType.includes("mov")));
}

export function isNodeVideoFile(node: ResourceHubNode): boolean {
  return hasNodeContentType(node, "video") && !isNodeMovFile(node);
}

export function getNodeThumbnail(node: ResourceHubNode) {
  const blob = node.file?.blob;
  const name = node.file?.name ?? node.name ?? "";

  if (!blob?.contentType?.includes("image") || !blob.url || !blob.width || !blob.height) {
    return null;
  }

  return {
    url: blob.url,
    width: blob.width,
    height: blob.height,
    alt: name,
  };
}

export function getNodeDocument(node: ResourceHubNode): ResourceHubDocument | null {
  return node.document ?? null;
}

export function getNodeFolder(node: ResourceHubNode): ResourceHubFolder | null {
  return node.folder ?? null;
}

export function getNodeFile(node: ResourceHubNode): ResourceHubFile | null {
  return node.file ?? null;
}

export function getNodeLink(node: ResourceHubNode): ResourceHubLink | null {
  return node.link ?? null;
}

export function getNodeResource(node: ResourceHubNode): ResourceHubResource | null {
  return node.document ?? node.folder ?? node.file ?? node.link ?? null;
}

export function getResourceId(resource: ResourceHubResource | null): string | null {
  return resource?.id ?? null;
}

export function getResourceName(resource: ResourceHubResource | null): string {
  return resource?.name ?? "";
}

export function getResourceParentFolderId(resource: ResourceHubResource): string | null {
  return resource.parentFolderId ?? null;
}

export function getResourceHubId(resource: ResourceHubResource): string | null {
  return resource.resourceHubId ?? null;
}

export function getDraftEditId(node: ResourceHubNode): string | null {
  return node.document?.id ?? null;
}

export function getFolderSelectLocationId(location: FolderSelectCurrentLocation) {
  return location.type === "folder" ? location.folder.id : location.resourceHub.id;
}

export function getFolderSelectLocationName(location: FolderSelectCurrentLocation) {
  return location.type === "folder" ? location.folder.name ?? "" : location.resourceHub.name;
}

function richTextToPlainText(content: string) {
  try {
    return richContentToString(JSON.parse(content));
  } catch {
    return null;
  }
}
