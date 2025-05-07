import * as TipTap from "@tiptap/react";
import * as People from "@/models/people";

import { MentionPopup } from "./MentionPopup";
import { NodeView } from "./NodeView";
import { mergeAttributes } from "@tiptap/core";

import Mention from "@tiptap/extension-mention";

export type SearchFn = ({ query }: { query: string }) => Promise<People.Person[]>;

export default {
  configure(searchFn: SearchFn) {
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
