import { PluginKey } from "@tiptap/pm/state";
import { flip, shift } from "@floating-ui/dom";
import { exitSuggestion } from "@tiptap/suggestion";
import * as TipTap from "@tiptap/react";

import { mergeAttributes } from "@tiptap/core";
import { MentionPopup } from "./MentionPopup";
import { NodeView } from "./NodeView";

import Mention from "@tiptap/extension-mention";

interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  profileLink: string;
}

export type SearchFn = ({ query }: { query: string }) => Promise<Person[]>;

const embeddedMentionKey = new PluginKey("embeddedMention");

export default {
  configure(searchFn?: SearchFn, container?: HTMLElement) {
    return Mention.extend({
      renderHTML({ HTMLAttributes }) {
        return ["react-component", mergeAttributes(HTMLAttributes)];
      },

      addNodeView() {
        return TipTap.ReactNodeViewRenderer(NodeView);
      },
    }).configure({
      suggestion: {
        placement: "bottom-start",
        container,
        floatingUi: {
          strategy: "fixed",
          ...(container ? { middleware: [flip({ boundary: container }), shift({ boundary: container })] } : {}),
        },
        render: () => new MentionPopup(container ? (view) => exitSuggestion(view, embeddedMentionKey) : undefined),
        // The library's document listener uses event.target, which is retargeted at shadow boundaries.
        ...(container ? { pluginKey: embeddedMentionKey, dismissOnOutsideClick: false, flip: false } : {}),
        items: searchFn,
        allowedPrefixes: [",", "\\s"],
      },

      // When deleting a mention with backspace, the mention node is deleted
      deleteTriggerWithBackspace: true,
    });
  },
};
