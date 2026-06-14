import * as React from "react";

import { plurarize } from "../utils/plurarize";
import { getNodeAuthorName, getNodeChildrenCount, getNodeDescription, getNodeFileSize, getNodeType } from "./selectors";
import type { ResourceHubNode } from "./types";

interface NodeDescriptionProps {
  node: ResourceHubNode;
  fontSize?: string;
  maxCharacters?: number;
}

const DEFAULT_FONT_SIZE = "text-xs";
const DEFAULT_MAX_CHARACTERS = 60;

export function NodeDescription({ node, fontSize = DEFAULT_FONT_SIZE, maxCharacters = DEFAULT_MAX_CHARACTERS }: NodeDescriptionProps) {
  return (
    <div className={fontSize}>
      <SubItemsCount node={node} />
      <Author node={node} />
      <FileSize node={node} />
      <ContentSnippet node={node} maxCharacters={maxCharacters} />
    </div>
  );
}

function Author({ node }: { node: ResourceHubNode }) {
  const nodeType = getNodeType(node);
  const authorName = getNodeAuthorName(node);

  if (nodeType === "folder" || !authorName) return null;

  return <span className="font-medium">{authorName}</span>;
}

function FileSize({ node }: { node: ResourceHubNode }) {
  const size = getNodeFileSize(node);

  if (getNodeType(node) !== "file" || size === null) return null;

  return (
    <span className="font-medium">
      {" "}
      <BulletDot /> {humanReadableSize(size)}
    </span>
  );
}

function SubItemsCount({ node }: { node: ResourceHubNode }) {
  const childrenCount = getNodeChildrenCount(node);

  if (getNodeType(node) !== "folder" || childrenCount === null) return null;

  return <span className="font-medium">{plurarize(childrenCount, "item", "items")}</span>;
}

function ContentSnippet({ node, maxCharacters }: { node: ResourceHubNode; maxCharacters: number }) {
  const nodeType = getNodeType(node);
  const description = getNodeDescription(node);

  if (nodeType === "folder" || nodeType === "link" || !description) return null;

  return (
    <>
      {" "}
      <MDash /> {truncateString(description, maxCharacters)}
    </>
  );
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

function BulletDot() {
  return <span>&bull;</span>;
}

function MDash() {
  return <span>&mdash;</span>;
}
