import React from "react";

//
// Implementation of extract and truncate for ProseMirror nodes.
//
// The extract function, extracts text-like content from a ProseMirror node.
// These are the text nodes and mention nodes. The mention nodes are converted
// to a Mention object with an id and label.
//
// The truncate function, truncates the extracted content to a given character
// count. The result is an array of JSX elements. The mention nodes are
// converted to a span with a link class.
//

interface Mention {
  id: string;
  label: string;
}

type ExtractResult = string | Mention;

export function extract(node: any): ExtractResult[] {
  let result: ExtractResult[] = [];

  if (node.type.name === "text") {
    result.push(node.text);
  } else if (node.type.name === "mention") {
    const mention = { id: node.attrs.id, label: node.attrs.label } as Mention;

    result.push(mention);
  } else if (node.content) {
    node.content.forEach((child: any) => {
      result.push(...extract(child));
    });

    if (node.type.name === "paragraph") {
      result.push(" ");
    }
  }

  return result;
}

export function truncate(extracted: ExtractResult[], characterCount: number): JSX.Element[] {
  let result: JSX.Element[] = [];
  let length = 0;

  for (let i = 0; i < extracted.length; i++) {
    const node = extracted[i];

    if (!node) continue;

    if (typeof node === "string") {
      if (length + node.length > characterCount) {
        const remaining = characterCount - length;
        const text = node.substring(0, remaining);

        length += remaining;
        result.push(<React.Fragment key={i}>{text}</React.Fragment>);
      } else {
        length += node.length;
        result.push(<React.Fragment key={i}>{node}</React.Fragment>);
      }
    }

    if (typeof node === "object") {
      length += node.label.length;

      result.push(
        <span key={i} className="font-medium text-link-base">
          @{node.label}
        </span>,
      );
    }

    if (length >= characterCount) {
      result.push(<React.Fragment key={i + 1}>&hellip;</React.Fragment>);

      break;
    }
  }

  return result;
}
