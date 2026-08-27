import * as React from "react";

import type { FormattedTimePreferences } from "../FormattedTime";
import { plurarize } from "../utils/plurarize";
import { NodeMetadata } from "./NodeMetadata";
import {
  getNodeAuthor,
  getNodeChildrenCount,
  getNodeDescription,
  getNodeFileSize,
  getNodeType,
  getNodeUpdatedAt,
} from "./selectors";
import type { ResourceHubNode } from "./types";

interface NodeDescriptionProps {
  node: ResourceHubNode;
  fontSize?: string;
  maxCharacters?: number;
  formattedTimePreferences?: FormattedTimePreferences;
}

const DEFAULT_FONT_SIZE = "text-sm";
const DEFAULT_MAX_CHARACTERS = 60;

export function NodeDescription({
  node,
  fontSize = DEFAULT_FONT_SIZE,
  maxCharacters = DEFAULT_MAX_CHARACTERS,
  formattedTimePreferences,
}: NodeDescriptionProps) {
  return (
    <NodeMetadata
      author={getNodeAuthor(node)}
      updatedAt={getNodeUpdatedAt(node)}
      details={buildDetails(node, maxCharacters)}
      formattedTimePreferences={formattedTimePreferences}
      textSizeClassName={fontSize}
    />
  );
}

function buildDetails(node: ResourceHubNode, maxCharacters: number): string[] {
  return [subItemsCount(node), fileSize(node), contentSnippet(node, maxCharacters)].filter((detail): detail is string =>
    Boolean(detail),
  );
}

function fileSize(node: ResourceHubNode) {
  const size = getNodeFileSize(node);

  if (getNodeType(node) !== "file" || size === null) return null;
  return humanReadableSize(size);
}

function subItemsCount(node: ResourceHubNode) {
  const childrenCount = getNodeChildrenCount(node);

  if (getNodeType(node) !== "folder" || childrenCount === null) return null;
  return plurarize(childrenCount, "item", "items");
}

function contentSnippet(node: ResourceHubNode, maxCharacters: number) {
  const nodeType = getNodeType(node);
  const description = getNodeDescription(node);

  if (nodeType === "folder" || nodeType === "link" || !description) return null;
  return truncateString(description, maxCharacters);
}

function humanReadableSize(size: number) {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)}KB`;
  return `${(size / (1024 * 1024)).toFixed(0)}MB`;
}

function truncateString(value: string, maxCharacters: number) {
  if (value.length <= maxCharacters) return value;
  return `${value.slice(0, maxCharacters)}…`;
}
