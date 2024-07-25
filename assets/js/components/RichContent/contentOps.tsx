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

export function shortenContent(jsonContent: string, limit: number, opts?: { skipParse?: boolean, suffix?: string }) {
  const content = opts?.skipParse ? jsonContent : JSON.parse(jsonContent);

  const dfs = (content, count) => {
    if(content.text) {
      const total = content.text.length + count;

      if (total > limit) {
        content.text = content.text.slice(0, (limit - count));

        if(opts?.suffix) {
          content.text += opts.suffix;
        }
      }

      count = total;
    }

    if(content.attrs?.label) {
      count += content.attrs.label.length;

      if (count > limit) {
        if(opts?.suffix) {
          content.attrs.label += opts.suffix;
        }
      }
    }

    if(content.content) {
      let included = 1;

      content.content.forEach(child => {
        count = dfs(child, count);

        if(count < limit) {
          included++;
        }
      })

      content.content = content.content.slice(0, included);
    }

    return count;
  }

  dfs(content, 0);

  return JSON.stringify(content);
}

export function countCharacters(jsonContent: string, opts?: { skipParse?: boolean }) {
  const content = opts?.skipParse ? jsonContent : JSON.parse(jsonContent);
  let count = 0;

  if(content.content) {
    for(let child of content.content) {
      count += countCharacters(child, { skipParse: true });
    }
  }

  if(content.text) {
    count += content.text.length;
  }

  if(content.attrs?.label) {
    count += content.attrs.label.length;
  }

  return count;
}
