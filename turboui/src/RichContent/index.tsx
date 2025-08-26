import React from "react";
import { Content, useEditor } from "../RichEditor";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";

interface RichContentProps {
  content: any;
  className?: string;
  mentionedPersonLookup?: MentionedPersonLookupFn;
}

export default function RichContent({ content, className, mentionedPersonLookup }: RichContentProps): JSX.Element {
  const editor = useEditor({
    content: content,
    editable: false,
    mentionedPersonLookup,
  });

  React.useEffect(() => {
    editor.setContent(content);
  }, [content]);

  return <Content editor={editor} className={className} />;
}

export * from "./contentOps";
export * from "./Summary";
export * from "./isContentEmpty";
