import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

const diffDecorationsKey = new PluginKey("richContentDiffDecorations");

/**
 * TipTap extension that paints a fixed DecorationSet (for split diffs).
 */
export function createDiffDecorationsExtension(decorations: DecorationSet) {
  return Extension.create({
    name: "richContentDiffDecorations",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: diffDecorationsKey,
          props: {
            decorations: () => decorations,
          },
        }),
      ];
    },
  });
}
