import * as React from "react";

import RichContent, { parseContent, richContentToString, shortenContent } from ".";

interface SummaryProps {
  jsonContent: string;
  characterCount: number;
}

export function Summary({ jsonContent, characterCount }: SummaryProps) {
  const summary = useSummarized(jsonContent, characterCount);

  return <RichContent jsonContent={summary} />;
}

//
// Summarize extracts the text content and mentions from a rich text object.
//

function useSummarized(content: any, characterCount: number): string {
  return React.useMemo(() => {
    const summary = summarize(parseContent(content));
    const shortened = shortenContent(summary, characterCount, { suffix: "...", skipParse: true });

    return shortened;
  }, [content, characterCount]);
}

export function summarize(node: any): any {
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
    case "mention":
      return summarizeMention(node);
    case "heading":
      return summarizeText(node);
    case "hard_break":
    case "horizontal_rule":
    case "blob":
      return null;
    default:
      return node;
  }
}

function summarizeDoc(node: any): any {
  return { type: "doc", content: flatten(node.content.map(summarize).filter((node: any) => node)) };
}

function summarizeBulletList(node: any): any {
  return { type: "text", text: mapNodes(node.content, richContentToString).join(" • ") };
}

function summarizeOrderedList(node: any): any {
  return { type: "text", text: enumerateStrings(mapNodes(node.content, richContentToString)).join(" ") };
}

function summarizeParagraph(node: any): any {
  return { type: "paragraph", content: mapNodes(node.content, summarize) };
}

function enumerateStrings(items: string[]): string[] {
  return items.map((item, index) => `${index + 1}. ${item}`);
}

function mapNodes(nodes: any[], fn: (node: any) => any): any[] {
  return (nodes || []).map(fn).filter((node: any) => node);
}

function flatten(nodes: any[]): any[] {
  const result: any[] = [];

  nodes.forEach((node) => {
    if (node.content) {
      result.push(...flatten(node.content));
    } else {
      result.push(node);
    }

    if (node.type === "paragraph") {
      result.push({ type: "text", text: " " });
    }
  });

  return result;
}

function summarizeText(node: any): any {
  return { type: "text", text: richContentToString(node) };
}

const summarizeMention = (node: any) => node;
