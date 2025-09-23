import React from "react";
import { Content, useEditor } from "../RichEditor";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";

interface RichContentProps {
  content: any;
  className?: string;
  mentionedPersonLookup: MentionedPersonLookupFn;
}

export default function RichContent({ content, className, mentionedPersonLookup }: RichContentProps): JSX.Element {
  const editor = useEditor({
    content: content,
    editable: false,
    handlers: {
      mentionedPersonLookup,
    }
  });

  React.useEffect(() => {
    // Use setTimeout to avoid flushSync warning by deferring the update
    setTimeout(() => {
      editor.setContent(content);
    }, 0);
  }, [content]);

  return <Content editor={editor} className={className} />;
}

export * from "./contentOps";
export * from "./Summary";
export * from "./isContentEmpty";
