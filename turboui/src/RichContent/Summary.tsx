import type { JSONContent } from "@tiptap/core";
import * as React from "react";

import RichContent, { parseContent, richContentToString, shortenContent } from ".";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";

interface SummaryProps {
  content: any;
  characterCount: number;
  mentionedPersonLookup: MentionedPersonLookupFn;
}

export function Summary({ content, characterCount, mentionedPersonLookup }: SummaryProps): JSX.Element {
  const transformContent = React.useCallback((value: any) => summarizeContent(value, characterCount), [characterCount]);

  return (
    <RichContent
      taskList={{ canEdit: false }}
      content={parseContent(content)}
      transformContent={transformContent}
      mentionedPersonLookup={mentionedPersonLookup}
      className="rich-text-summary"
      thumbnailBlobs
    />
  );
}

//
// Summarize extracts the text content and mentions from a rich text object, preserving attached blob nodes in the summarized output.
//

function summarizeContent(content: any, characterCount: number): any {
  const summary = summarize(parseContent(content));
  const textContent = (summary.content || []).filter((node: any) => !paragraphHasBlob(node));
  const blobContent = (summary.content || []).filter((node: any) => paragraphHasBlob(node));
  const shortened = shortenContent({ ...summary, content: textContent }, characterCount, {
    suffix: "...",
    skipParse: true,
  });

  return {
    ...shortened,
    content: [...(shortened.content || []), ...blobContent],
  };
}

function paragraphHasBlob(node: any): boolean {
  return node?.type === "paragraph" && (node.content || []).some((child: any) => child.type === "blob");
}

export function summarize(node: any): any {
  if (!node) return { type: "doc", content: [] };

  switch (node.type) {
    case "doc":
      return summarizeDoc(node);
    case "paragraph":
      return summarizeParagraph(node);
    case "text":
      return summarizeText(node);
    case "heading":
      return summarizeText(node);
    case "bulletList":
      return summarizeBulletList(node);
    case "orderedList":
      return summarizeOrderedList(node);
    case "taskList":
      return summarizeTaskList(node);
    case "blockquote":
      return summarizeBlockquote(node);
    case "mention":
      return summarizeMention(node);
    case "hardBreak":
    case "horizontalRule":
    case "codeBlock":
      return null;
    case "blob":
      return summarizeBlob(node);
    default:
      console.log("Unknown node type", node.type);
      return node;
  }
}

function summarizeDoc(node: any): any {
  const flattened = flatten((node.content || []).map(summarize).filter((child: any) => child));
  const blobs = flattened.filter((child: any) => child.type === "blob");
  const rest = trimEdgeSpaces(flattened.filter((child: any) => child.type !== "blob"));
  const content: any[] = [];

  if (rest.length > 0) {
    content.push({ type: "paragraph", content: rest });
  }

  if (blobs.length > 0) {
    content.push({ type: "paragraph", content: blobs });
  }

  return { type: "doc", content };
}

function summarizeTaskList(node: JSONContent): JSONContent {
  return {
    type: "paragraph",
    content: (node.content ?? []).flatMap((item) => [
      { type: "text", text: `${item.attrs?.checked ? "☑" : "☐"} ` },
      ...(item.content ?? []).map(summarize).filter(Boolean),
    ]),
  };
}

function summarizeBulletList(node: any): any {
  return {
    type: "text",
    text: mapNodes(node.content, (node: any) => "• " + richContentToString(node)).join(" "),
  };
}

function summarizeOrderedList(node: any): any {
  return {
    type: "text",
    text: mapNodes(node.content, (node: any, i: number) => `${i + 1}. ${richContentToString(node)}`).join(" "),
  };
}

function summarizeBlockquote(node: any): any {
  // Blockquotes contain paragraphs or other content
  // We process them similar to a doc - flatten all content into a single result
  if (!node.content) {
    return { type: "paragraph", content: [] };
  }

  const summarizedContent = node.content.map(summarize).filter((node: any) => node);
  const flattened = flatten(summarizedContent);

  // Return a paragraph with the flattened content
  return { type: "paragraph", content: flattened };
}

function summarizeParagraph(node: any): any {
  return { type: "paragraph", content: mapNodes(node.content, summarize) };
}

function mapNodes(nodes: any[], fn: (node: any, index: number) => any): any[] {
  return (nodes || []).map(fn).filter((node: any) => node);
}

function flatten(nodes: any[]): any[] {
  const result: any[] = [];

  nodes.forEach((node, index) => {
    if (node.content) {
      result.push(...flatten(node.content));
    } else {
      result.push(node);
    }

    if (node.type === "paragraph" && index < nodes.length - 1) {
      result.push({ type: "text", text: " " });
    }
  });

  return result;
}

function summarizeText(node: any): any {
  return { type: "text", text: richContentToString(node) };
}

function trimEdgeSpaces(nodes: any[]): any[] {
  const result = [...nodes];

  while (result[0]?.type === "text" && result[0]?.text === " ") {
    result.shift();
  }

  while (result.at(-1)?.type === "text" && result.at(-1)?.text === " ") {
    result.pop();
  }

  return result;
}

function summarizeBlob(node: any) {
  const attrs = normalizeBlobAttrs(node.attrs);

  if (attrs?.src) {
    return { type: "blob", attrs };
  }

  if (!attrs?.title) return null;
  return { type: "text", text: attrs.title };
}

function normalizeBlobAttrs(attrs: any) {
  if (!attrs) return attrs;

  const src = attrs.src;
  if (!src || typeof src !== "object") return attrs;

  return {
    ...attrs,
    id: attrs.id || src.id,
    src: src.url,
  };
}

const summarizeMention = (node: any) => node;
