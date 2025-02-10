import React from "react";

//
// Sumarize removes non-text content from a rich text object,
// and truncates the text content to a given character limit.
//
function summarize(content: any, limit: number): any {
  const richText = richContentToString(parseContent(content));
  return shortenContent(richText, limit, { skipParse: true });
}

export function useSumarizedContent(content: any, limit: number): any {
  return React.useMemo(() => summarize(content, limit), [content, limit]);
}

//
// ShortenContent truncates the text content of a rich text object to a given character limit.
// It does not remove non-text content.
//
export function shortenContent(jsonContent: string, limit: number, opts?: { skipParse?: boolean; suffix?: string }) {
  const content = opts?.skipParse ? jsonContent : JSON.parse(jsonContent);

  const dfs = (content: any, count: number) => {
    if (content.text) {
      const total = content.text.length + count;

      if (total > limit) {
        content.text = content.text.slice(0, limit - count);

        if (opts?.suffix) {
          content.text += opts.suffix;
        }
      }

      count = total;
    }

    if (content.attrs?.label) {
      count += content.attrs.label.length;

      if (count > limit) {
        if (opts?.suffix) {
          content.attrs.label += opts.suffix;
        }
      }
    }

    if (content.content) {
      let included = 1;

      content.content.forEach((child: any) => {
        count = dfs(child, count);

        if (count < limit) {
          included++;
        }
      });

      content.content = content.content.slice(0, included);
    }

    return count;
  };

  dfs(content, 0);

  return JSON.stringify(content);
}

export function countCharacters(jsonContent: string, opts?: { skipParse?: boolean }) {
  const content = opts?.skipParse ? jsonContent : JSON.parse(jsonContent);
  let count = 0;

  if (content.content) {
    for (let child of content.content) {
      count += countCharacters(child, { skipParse: true });
    }
  }

  if (content.text) {
    count += content.text.length;
  }

  if (content.attrs?.label) {
    count += content.attrs.label.length;
  }

  return count;
}

export function areRichTextObjectsEqual(obj1: any, obj2: any) {
  // Only one is object
  if (typeof obj1 !== "object" && typeof obj2 === "object") {
    return false;
  }

  // Only one is array
  if (Array.isArray(obj1) && !Array.isArray(obj2)) {
    return false;
  }

  // Compare non-objects
  if (typeof obj1 !== "object" && typeof obj2 !== "object") {
    return obj1 === obj2;
  }

  // Compare arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    return obj1.every((item, index) => areRichTextObjectsEqual(item, obj2[index]));
  }

  // Compare objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  return keys1.every((key) => areRichTextObjectsEqual(obj1[key], obj2[key]));
}

export function emptyContent() {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function richContentToString(node: any): string {
  let result: string[] = [];

  if (node.type === "text") {
    result.push(node.text);
  } else if (node.type === "mention") {
    result.push(node.attrs.label);
  } else if (node.content) {
    node.content.forEach((child: any) => {
      result.push(richContentToString(child));
    });

    if (node.type.name === "paragraph") {
      result.push(" ");
    }
  }

  return result.join(" ");
}

function parseContent(content?: string | any): any {
  if (content?.constructor?.name === "String") {
    return JSON.parse(content);
  } else {
    return content;
  }
}
