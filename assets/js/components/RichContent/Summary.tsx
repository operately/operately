import React from "react";

import * as TipTapEditor from "@/components/Editor";
import { extract, truncate } from "./contentOps";

export function Summary({ jsonContent, characterCount }): JSX.Element {
  const { editor } = TipTapEditor.useEditor({
    content: parseContent(jsonContent),
    editable: false,
  });

  React.useEffect(() => {
    if (!editor) return;

    editor.commands.setContent(parseContent(jsonContent));
  }, [jsonContent]);

  let summary: JSX.Element[] = React.useMemo(() => {
    if (!editor) return [<></>];

    const extracted = extract(editor.state.doc);
    const truncated = truncate(extracted, characterCount);

    return truncated;
  }, [editor, jsonContent]);

  if (!editor) return <></>;
  return <div>{summary}</div>;
}

function parseContent(content: string | any): any {
  if (content.constructor.name === "String") {
    return JSON.parse(content);
  } else {
    return content;
  }
}
