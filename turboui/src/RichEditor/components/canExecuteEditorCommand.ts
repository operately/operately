import type { Editor } from "@tiptap/react";

// TipTap nulls `commandManager` on destroy; RR7 transitions can re-render afterward.
export function canExecuteEditorCommand(
  editor: Editor | null | undefined,
  check: (can: ReturnType<Editor["can"]>) => boolean,
): boolean {
  if (!editor || editor.isDestroyed) return false;

  return check(editor.can());
}
