import * as React from "react";
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
  if (node.type === "folder" || !node.authorName) return null;
  return <span className="font-medium">{node.authorName}</span>;
}

function FileSize({ node }: { node: ResourceHubNode }) {
  if (node.type !== "file" || node.size === undefined || node.size === null) return null;

  return (
    <span className="font-medium">
      {" "}
      <BulletDot /> {humanReadableSize(node.size)}
    </span>
  );
}

function SubItemsCount({ node }: { node: ResourceHubNode }) {
  if (node.type !== "folder" || node.childrenCount === undefined || node.childrenCount === null) return null;
  return <span className="font-medium">{pluralize(node.childrenCount, "item", "items")}</span>;
}

function ContentSnippet({ node, maxCharacters }: { node: ResourceHubNode; maxCharacters: number }) {
  if (node.type === "folder" || node.type === "link" || !node.description) return null;

  return (
    <>
      {" "}
      <MDash /> {truncateString(node.description, maxCharacters)}
    </>
  );
}

function humanReadableSize(size: number) {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)}KB`;
  return `${(size / (1024 * 1024)).toFixed(0)}MB`;
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
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
