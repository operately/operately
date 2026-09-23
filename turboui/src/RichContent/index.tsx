import React from "react";
import { Content, useEditor } from "../RichEditor";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";

interface Props {
  content: any;
  className?: string;
  mentionedPersonLookup: MentionedPersonLookupFn;
  parseContent?: boolean;
  thumbnailBlobs?: boolean;
  transformContent?: (content: any) => any;
}

export default function RichContent({
  content,
  className,
  mentionedPersonLookup,
  parseContent,
  thumbnailBlobs,
  transformContent,
}: Props) {
  const parsed = React.useMemo(() => (parseContent ? JSON.parse(content) : content), [content, parseContent]);
  const editor = useEditor({
    content: parsed,
    editable: false,
    thumbnailBlobs,
    transformContent,
    handlers: { mentionedPersonLookup },
  });

  return <Content editor={editor} className={className} />;
}

export * from "./contentOps";
export * from "./Summary";
export * from "./isContentEmpty";
export * from "./types";
export * from "./restoreSource";
