import { Space } from "@/models/spaces";

import {
  ResourceHubFolder,
  ResourceHub,
  ResourceHubDocument,
  ResourceHubFile,
  ResourceHubLink,
  ResourceHubNode,
  ResourceHubPermissions,
} from "@/models/resourceHubs";

import { assertPresent } from "@/utils/assertions";
import { Paths } from "@/routes/paths";
import { findCommentsCount } from "./utils";

export interface Location {
  index: number;
  name: string;
  type: "home" | "space" | "resourceHub" | "folder";
  resource: "home" | Space | ResourceHub | ResourceHubFolder;
}

// represents a full path to a resource, starting from the root
// e.g. [home, space, resourceHub, folder1, folder2]
export type Path = Location[];
export type NodeType = "folder" | "document" | "file" | "link";

export interface DecoratedNode {
  type: NodeType;
  name: string;
  path: Path;
  link: string;

  rawNode: ResourceHubNode;
  resource: ResourceHubFolder | ResourceHubDocument | ResourceHubFile | ResourceHubLink;

  permissions?: ResourceHubPermissions;
  commentsCount?: number;
}

export function decorateNodes(space: Space, hub: ResourceHub, nodes: ResourceHubNode[]): DecoratedNode[] {
  return nodes.map((node) => decorateNode(space, hub, node));
}

function decorateNode(space: Space, hub: ResourceHub, node: ResourceHubNode): DecoratedNode {
  assertPresent(node.type, "node.type must be present");
  assertPresent(node.name, "node.name must be present");

  validateNodeType(node.type);

  return {
    type: node.type,
    name: node.name,
    path: createPath(space, hub, node),
    link: findLinkPath(node),

    rawNode: node,
    resource: node,
    permissions: hub.permissions!,
    commentsCount: findCommentsCount(node.type, node),
  };
}

function createPath(space: Space, hub: ResourceHub, node: ResourceHubNode): Path {
  assertPresent(space.name, "space.name must be present");
  assertPresent(hub.name, "hub.name must be present");
  assertPresent(node.name, "node.name must be present");

  const path: Path = [
    { index: 0, name: "home", type: "home", resource: "home" },
    { index: 1, name: space.name, type: "space", resource: space },
    { index: 2, name: hub.name, type: "resourceHub", resource: hub },
  ];

  if (node.type === "folder") {
    path.push({ index: 3, name: node.name, type: "folder", resource: node });
  }

  return path;
}

function validateNodeType(type: string): asserts type is "folder" | "document" | "file" | "link" {
  if (!["folder", "document", "file", "link"].includes(type)) {
    throw new Error(`Invalid node type: ${type}`);
  }
}

function findLinkPath(node: ResourceHubNode): string {
  switch (node.type) {
    case "document":
      assertPresent(node.document?.id, "document must be present in node");
      return Paths.resourceHubDocumentPath(node.document.id);
    case "folder":
      assertPresent(node.folder?.id, "folder must be present in node");
      return Paths.resourceHubFolderPath(node.folder.id);
    case "link":
      assertPresent(node.link?.id, "link must be present in node");
      return Paths.resourceHubLinkPath(node.link.id);
    case "file":
      assertPresent(node.file?.id, "file must be present in node");
      return Paths.resourceHubFilePath(node.file.id);
    default:
      throw new Error(`Invalid node type: ${node.type}`);
  }
}
