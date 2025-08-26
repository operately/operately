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

export default {
  configure(searchFn?: SearchFn) {
    return Mention.extend({
      renderHTML({ HTMLAttributes }) {
        return ["react-component", mergeAttributes(HTMLAttributes)];
      },

      addNodeView() {
        return TipTap.ReactNodeViewRenderer(NodeView);
      },
    }).configure({
      suggestion: {
        render: () => new MentionPopup(),
        items: searchFn,
        allowedPrefixes: [",", "\\s"],
      },

      // When deleting a mention with backspace, the mention node is deleted
      deleteTriggerWithBackspace: true,
    });
  },
};
