import React from "react";
import { Content, useEditor } from "../RichEditor";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";

interface Props {
  content: any;
  className?: string;
  mentionedPersonLookup: MentionedPersonLookupFn;
  parseContent?: boolean;
}

export default function RichContent({ content, className, mentionedPersonLookup, parseContent }: Props) {
  const editor = useEditor({
    content: parseContent ? JSON.parse(content) : content,
    editable: false,
    handlers: {
      mentionedPersonLookup,
    },
  });

  React.useEffect(() => {
    // Use setTimeout to avoid flushSync warning by deferring the update
    setTimeout(() => {
      editor.setContent(parseContent ? JSON.parse(content) : content);
    }, 0);
  }, [content, parseContent]);

  return <Content editor={editor} className={className} />;
}

export * from "./contentOps";
export * from "./Summary";
export * from "./isContentEmpty";
