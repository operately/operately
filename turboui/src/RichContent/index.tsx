import React from "react";
import { Content, useEditor } from "../RichEditor";
import { MentionedPersonLookupFn, ResolveResourceLinkTitlesFn } from "../RichEditor/useEditor";

interface Props {
  content: any;
  className?: string;
  mentionedPersonLookup: MentionedPersonLookupFn;
  parseContent?: boolean;
  thumbnailBlobs?: boolean;
  transformContent?: (content: any) => any;
  /** Pass null to explicitly disable resource title lookup. */
  resolveResourceLinkTitles: ResolveResourceLinkTitlesFn | null;
}

export default function RichContent({
  content,
  className,
  mentionedPersonLookup,
  parseContent,
  thumbnailBlobs,
  transformContent,
  resolveResourceLinkTitles,
}: Props) {
  const parsed = React.useMemo(() => (parseContent ? JSON.parse(content) : content), [content, parseContent]);
  const editor = useEditor({
    content: parsed,
    editable: false,
    thumbnailBlobs,
    transformContent,
    handlers: { mentionedPersonLookup, resolveResourceLinkTitles },
  });

  return <Content editor={editor} className={className} />;
}

export * from "./contentOps";
export * from "./Summary";
export * from "./isContentEmpty";
export * from "./types";
export * from "./resourceLinks";
