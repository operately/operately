import React from "react";
import { Content, useEditor } from "../RichEditor";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import { applyResourceLinkTitles, type ResourceLinkTitle } from "./resourceLinks";

interface Props {
  content: any;
  className?: string;
  mentionedPersonLookup: MentionedPersonLookupFn;
  parseContent?: boolean;
  thumbnailBlobs?: boolean;
  resourceLinkTitles?: ResourceLinkTitle[];
}

export default function RichContent({
  content,
  className,
  mentionedPersonLookup,
  parseContent,
  thumbnailBlobs,
  resourceLinkTitles,
}: Props) {
  const displayContent = React.useMemo(() => {
    const parsed = parseContent ? JSON.parse(content) : content;
    const origin = typeof window === "undefined" ? undefined : window.location.origin;

    return applyResourceLinkTitles(parsed, resourceLinkTitles ?? [], origin ? { origin } : undefined);
  }, [content, parseContent, resourceLinkTitles]);

  const editor = useEditor({
    content: displayContent,
    editable: false,
    thumbnailBlobs,
    handlers: {
      mentionedPersonLookup,
    },
  });

  React.useEffect(() => {
    // Use setTimeout to avoid flushSync warning by deferring the update
    setTimeout(() => {
      editor.setContent(displayContent);
    }, 0);
  }, [displayContent]);

  return <Content editor={editor} className={className} />;
}

export * from "./contentOps";
export * from "./Summary";
export * from "./isContentEmpty";
export * from "./types";
export * from "./resourceLinks";
