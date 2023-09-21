import React from "react";

// import Mention from "@tiptap/extension-mention";
// import StarterKit from "@tiptap/starter-kit";
// import Link from "@tiptap/extension-link";

// import { generateHTML } from "@tiptap/html";

/*
 * This is a function that takes a JSON string and returns a React component.
 * The json content must be in the format that tiptap uses.
 */

interface RichContentProps {
  jsonContent: string;
  className?: string;
}

import * as TipTapEditor from "@/components/Editor";

export default function RichContent({ jsonContent, className }: RichContentProps): JSX.Element {
  const editor = TipTapEditor.useEditor({
    content: JSON.parse(jsonContent),
    editable: false,
  });

  React.useEffect(() => {
    if (!editor) return;

    editor.commands.setContent(JSON.parse(jsonContent));
  }, [jsonContent]);

  return <TipTapEditor.EditorContent editor={editor} className={"ProseMirror " + className} />;
}

RichContent.defaultProps = {
  className: "",
};
