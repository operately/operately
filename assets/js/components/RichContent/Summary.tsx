import React from "react";

import * as TipTapEditor from "@/components/Editor";

export function Summary({ jsonContent, characterCount }): JSX.Element {
  const { editor } = TipTapEditor.useEditor({
    content: JSON.parse(jsonContent),
    editable: false,
  });

  React.useEffect(() => {
    if (!editor) return;

    editor.commands.setContent(JSON.parse(jsonContent));
  }, [jsonContent]);

  let summary: JSX.Element[] = React.useMemo(() => {
    if (!editor) return [<></>];

    const extracted = extract(editor.state.doc);
    let result: JSX.Element[] = [];
    let length = 0;
    let contracted = false;

    extracted.forEach((node) => {
      if (typeof node === "string") {
        if (length + node.length > characterCount) {
          const remaining = characterCount - length;
          const text = node.substring(0, remaining);

          result.push(<>{text}...</>);
          contracted = true;
        } else {
          result.push(<>{node}</>);
        }

        length += node.length;
      } else {
        result.push(<span className="font-medium text-link-base">@{node.label}</span>);
      }
    });

    return result;
  }, [editor, jsonContent]);

  if (!editor) return <></>;
  return <div>{summary}</div>;
}

// Utils
// Extract text and mentions from the editor state

interface Mention {
  id: string;
  label: string;
}

type ExtractResult = string | Mention;

function extract(node: any): ExtractResult[] {
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
  }

  return result;
}
