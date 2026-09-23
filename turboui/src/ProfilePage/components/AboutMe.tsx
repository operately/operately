import type { ResolveResourceLinkTitlesFn } from "../../RichEditor/useEditor";
import React from "react";

import RichContent, { parseContent } from "../../RichContent";
import { MentionedPersonLookupFn } from "../../RichEditor/useEditor";

export function AboutMe({
  content,
  mentionedPersonLookup,
  resolveResourceLinkTitles,
}: {
  content: string | null | undefined;
  mentionedPersonLookup: MentionedPersonLookupFn;
  resolveResourceLinkTitles: ResolveResourceLinkTitlesFn | null;
}) {
  const parsedContent = parseContent(content);

  return (
    <div>
      <div className="text-xs mb-2 uppercase font-bold">About me</div>
      <RichContent
        content={parsedContent}
        mentionedPersonLookup={mentionedPersonLookup}
        resolveResourceLinkTitles={resolveResourceLinkTitles}
        className="text-sm leading-relaxed"
      />
    </div>
  );
}
