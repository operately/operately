import * as React from "react";
import { IconMarkdown } from "../../icons";

import { useMarkdownHints } from "../EditorContext";
import { ToolbarToggleButton } from "./ToolbarToggleButton";

//
// A subtle toggle reflecting the person's server-persisted "markdown shortcuts"
// hint preference. Its active/inactive state is the entire discoverability
// mechanism — no tooltip, banner, modal, or cheatsheet is involved. It does not
// touch document content, so there is no editor.chain() command here.
//
// Renders nothing when the consumer hasn't wired the preference, so existing
// RichEditor usages that don't provide it are unaffected.
//
export function MarkdownModeButton({ iconSize }: { iconSize?: number }): JSX.Element | null {
  const markdownHints = useMarkdownHints();

  if (!markdownHints) return null;

  return (
    <ToolbarToggleButton onClick={markdownHints.onToggle} isActive={markdownHints.enabled} title="Markdown shortcuts">
      <IconMarkdown size={iconSize} />
    </ToolbarToggleButton>
  );
}
