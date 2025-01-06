import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { richContentToString } from "@/components/RichContent";
import { truncateString } from "@/utils/strings";

import * as Hub from "@/models/resourceHubs";

import { assertPresent } from "@/utils/assertions";
import plurarize from "@/utils/plurarize";
import { match } from "ts-pattern";

interface NodeDescriptionProps {
  node: Hub.ResourceHubNode;
  fontSize?: string;
  maxCharacters?: number;
}

const NODE_DESCRIPTION_DEFAULT = {
  fontSize: "text-xs",
  maxCharacters: 60,
};

export function NodeDescription(props: NodeDescriptionProps) {
  props = { ...NODE_DESCRIPTION_DEFAULT, ...props };

  return (
    <div className={props.fontSize}>
      <SubItemsCount node={props.node} />
      <Author node={props.node} />
      <FileSize node={props.node} />
      <ContentSnippet node={props.node} maxCharacters={props.maxCharacters!} />
    </div>
  );
}

function Author({ node }: { node: Hub.ResourceHubNode }) {
  if (node.type === "folder") return null;

  const author = match(node.type)
    .with("document", () => node.document?.author)
    .with("file", () => node.file?.author)
    .with("link", () => node.link?.author)
    .run();

  if (author === undefined || author === null) return null;

  return <span className="font-medium">{author!.fullName}</span>;
}

function FileSize({ node }: { node: Hub.ResourceHubNode }) {
  if (node.type !== "file") return null;

  return (
    <span className="font-medium">
      {" "}
      <MiddotDot /> {humanReadableSize(node.file!)}
    </span>
  );
}

function SubItemsCount({ node }: { node: Hub.ResourceHubNode }) {
  if (node.type !== "folder") return null;

  assertPresent(node.folder?.childrenCount, "childrenCount must be present in node.folder");

  return <span className="font-medium">{plurarize(node.folder.childrenCount, "item", "items")}</span>;
}

function ContentSnippet({ node, maxCharacters }: { node: Hub.ResourceHubNode; maxCharacters: number }) {
  if (node.type === "folder") return null;
  if (node.type === "link") return null;

  const content = match(node.type)
    .with("document", () => {
      assertPresent(node.document?.content, "content must be present in node.document");
      return richContentToString(JSON.parse(node.document.content));
    })
    .with("file", () => {
      assertPresent(node.file?.description, "description must be present in node.file");
      return richContentToString(JSON.parse(node.file.description));
    })
    .run();

  if (content === undefined || content === "") return null;

  return (
    <>
      {" "}
      <Dash /> {truncateString(content, maxCharacters)}
    </>
  );
}

function MiddotDot() {
  return <span className="text-content-dimmed">•</span>;
}

function Dash() {
  return <span className="text-content-dimmed">&mdash;</span>;
}

function humanReadableSize(file: Hub.ResourceHubFile) {
  let humanReadableSize = "";

  assertPresent(file.size, "size must be present in file");

  if (file.size < 1024) {
    humanReadableSize = `${file.size}B`;
  } else if (file.size < 1024 * 1024) {
    humanReadableSize = `${(file.size / 1024).toFixed(0)}KB`;
  } else {
    humanReadableSize = `${(file.size / (1024 * 1024)).toFixed(0)}MB`;
  }

  return humanReadableSize;
}
