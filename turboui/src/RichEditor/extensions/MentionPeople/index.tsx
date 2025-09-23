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
      addAttributes() {
        const parent = this.parent?.();

        return {
          ...parent,
          avatarUrl: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-avatar-url"),
            renderHTML: (attributes) => {
              if (!attributes.avatarUrl) return {};

              return {
                "data-avatar-url": attributes.avatarUrl,
              };
            },
          },
          fullName: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-full-name"),
            renderHTML: (attributes) => {
              if (!attributes.fullName) return {};

              return {
                "data-full-name": attributes.fullName,
              };
            },
          },
          avatarSize: {
            default: null,
            parseHTML: (element) => {
              const value = element.getAttribute("data-avatar-size");
              return value ? Number(value) : null;
            },
            renderHTML: (attributes) => {
              if (typeof attributes.avatarSize !== "number") return {};

              return {
                "data-avatar-size": attributes.avatarSize,
              };
            },
          },
        };
      },
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
