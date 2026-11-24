import { Extension } from "@tiptap/core";
import { flip, shift } from "@floating-ui/dom";
import { PluginKey } from "@tiptap/pm/state";
import { exitSuggestion, Suggestion } from "@tiptap/suggestion";
import { MentionPopup } from "../MentionPeople/MentionPopup";
import { ResourceList } from "./ResourceList";

export type ResourceSuggestion = {
  id: string;
  title: string;
  type: "goal" | "project" | "task";
  context?: string;
  url: string;
};

export type ResourceSearchFn = (query: string) => Promise<ResourceSuggestion[]>;

const resourceSuggestionKey = new PluginKey("resourceSuggestion");

export const MentionResources = Extension.create<{ search: ResourceSearchFn; container?: HTMLElement }>({
  name: "mentionResources",

  addOptions() {
    return { search: async () => [] };
  },

  addProseMirrorPlugins() {
    const { search, container } = this.options;

    return [
      Suggestion<ResourceSuggestion>({
        editor: this.editor,
        char: "#",
        pluginKey: resourceSuggestionKey,
        allowSpaces: true,
        allowedPrefixes: [" ", "\t", "\n"],
        // Search happens in the list so the popup can show progress and discard stale replies.
        items: () => [],
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          const parent = $from.parent;
          if (
            parent.type.spec.code ||
            state.selection.$from.marks().some((mark) => mark.type.name === "link" || mark.type.spec.code)
          )
            return false;
          const before = parent.textBetween(0, $from.parentOffset);
          const query = state.doc.textBetween(range.from + 1, range.to);
          return (before.length === 0 || /\s$/.test(before)) && !/^\s/.test(query);
        },
        command: ({ editor, range, props }) => {
          const resource = props as ResourceSuggestion;
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              { type: "text", text: resource.url, marks: [{ type: "link", attrs: { href: resource.url } }] },
              { type: "text", text: " " },
            ])
            .run();
        },
        render: () =>
          new MentionPopup(
            container ? (view) => exitSuggestion(view, resourceSuggestionKey) : undefined,
            ResourceList,
            { search },
          ),
        container,
        floatingUi: {
          strategy: "fixed",
          ...(container ? { middleware: [flip({ boundary: container }), shift({ boundary: container })] } : {}),
        },
        ...(container ? { dismissOnOutsideClick: false, flip: false } : {}),
      }),
    ];
  },
});
