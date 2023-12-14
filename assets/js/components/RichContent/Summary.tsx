import React from "react";

import * as TipTapEditor from "@/components/Editor";
import { extract } from "./textExtract";

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

    extracted.forEach((node, index) => {
      if (typeof node === "string") {
        if (length + node.length > characterCount) {
          const remaining = characterCount - length;
          const text = node.substring(0, remaining);

          result.push(<React.Fragment key={index}>{text}...</React.Fragment>);
          contracted = true;
        } else {
          result.push(<React.Fragment key={index}>{node}</React.Fragment>);
        }

        length += node.length;
      } else {
        result.push(
          <span key={index} className="font-medium text-link-base">
            @{node.label}
          </span>,
        );
      }
    });

    return result;
  }, [editor, jsonContent]);

  if (!editor) return <></>;
  return <div>{summary}</div>;
}
