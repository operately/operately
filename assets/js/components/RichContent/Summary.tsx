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

  if (!editor) return <></>;

  const doc = editor.state.doc;
  const text = doc.textBetween(0, doc.nodeSize - 2, " ");

  if (text.length > characterCount) {
    return <>{text.slice(0, characterCount)}...</>;
  } else {
    return <>{text}</>;
  }
}
