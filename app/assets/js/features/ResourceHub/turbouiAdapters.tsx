import * as Api from "@/api";
import type { Paths } from "@/routes/paths";
import {
  richContentToString,
  type ResourceHubDraftNode,
  type ResourceHubNode,
  type ResourceHubPermissions,
} from "turboui";
import { findCommentsCount, findPath, NodeType } from "./utils";

export function resourceToHeader(resource: Api.ResourceHub | Api.ResourceHubFolder) {
  return {
    name: resource.name || "",
    permissions: permissionsToUi(resource.permissions),
  };
}

export function nodeToUiNode(paths: Paths, node: Api.ResourceHubNode): ResourceHubNode {
  const nodeType = assertNodeType(node.type);

  return {
    id: node.id || resourceId(node),
    name: node.name || resourceName(node),
    type: nodeType,
    path: findPath(paths, nodeType, node),
    insertedAt: node.insertedAt,
    updatedAt: node.updatedAt,
    commentsCount: findCommentsCount(nodeType, node),
    authorName: authorName(node),
    childrenCount: node.folder?.childrenCount,
    size: node.file?.size,
    description: description(node),
    linkType: node.link?.type,
    contentType: node.file?.blob?.contentType,
    thumbnail: thumbnail(node),
  };
}

export function draftNodeToUiNode(paths: Paths, node: Api.ResourceHubNode): ResourceHubDraftNode {
  const uiNode = nodeToUiNode(paths, node);

  return {
    ...uiNode,
    editPath: node.document?.id ? paths.resourceHubEditDocumentPath(node.document.id) : uiNode.path,
  };
}

function permissionsToUi(permissions?: Api.ResourceHubPermissions | null): ResourceHubPermissions | undefined {
  if (!permissions) return undefined;

  return {
    canCreateDocument: Boolean(permissions.canCreateDocument),
    canCreateFile: Boolean(permissions.canCreateFile),
    canCreateFolder: Boolean(permissions.canCreateFolder),
    canCreateLink: Boolean(permissions.canCreateLink),
  };
}

function assertNodeType(type: string | null | undefined): NodeType {
  if (type === "document" || type === "folder" || type === "file" || type === "link") return type;
  throw new Error(`Unsupported resource hub node type: ${type}`);
}

function resourceId(node: Api.ResourceHubNode) {
  return node.document?.id || node.folder?.id || node.file?.id || node.link?.id || "";
}

function resourceName(node: Api.ResourceHubNode) {
  return node.document?.name || node.folder?.name || node.file?.name || node.link?.name || "";
}

function authorName(node: Api.ResourceHubNode) {
  switch (node.type) {
    case "document":
      return node.document?.author?.fullName;
    case "file":
      return node.file?.author?.fullName;
    case "link":
      return node.link?.author?.fullName;
    default:
      return null;
  }
}

function description(node: Api.ResourceHubNode) {
  if (node.type === "document") return richTextToPlainText(node.document?.content);
  if (node.type === "file") return richTextToPlainText(node.file?.description);
  return null;
}

function richTextToPlainText(content: string | null | undefined) {
  if (!content) return null;

  try {
    return richContentToString(JSON.parse(content));
  } catch {
    return null;
  }
}

function thumbnail(node: Api.ResourceHubNode) {
  const blob = node.file?.blob;

  if (node.type !== "file" || !blob?.contentType?.includes("image") || !blob.url || !blob.width || !blob.height) {
    return null;
  }

  return {
    url: blob.url,
    width: blob.width,
    height: blob.height,
    alt: node.file?.name || node.name || "",
  };
}
