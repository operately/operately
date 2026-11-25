import { Mark } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fakeTextSelection: {
      setFakeTextSelection: () => ReturnType;
      unsetFakeTextSelection: () => ReturnType;
    };
  }
}

const selectionHighlight = new PluginKey<DecorationSet>("fakeTextSelection");

// Keep the old mark readable for documents that already stored it.
const FakeTextSelection = Mark.create({
  name: "fakeTextSelection",
  renderHTML: () => ["span", 0],

  addCommands() {
    return {
      setFakeTextSelection:
        () =>
        ({ tr, dispatch }) => {
          const { from, to } = tr.selection;
          const decorations = from === to ? [] : [Decoration.inline(from, to, { "data-editor-selection": "" })];
          if (dispatch) tr.setMeta(selectionHighlight, DecorationSet.create(tr.doc, decorations));
          return true;
        },
      unsetFakeTextSelection:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) tr.setMeta(selectionHighlight, DecorationSet.empty);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: selectionHighlight,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, decorations: DecorationSet) =>
            tr.getMeta(selectionHighlight) ?? decorations.map(tr.mapping, tr.doc),
        },
        props: { decorations: (state) => selectionHighlight.getState(state) },
      }),
    ];
  },
});

export default FakeTextSelection;
