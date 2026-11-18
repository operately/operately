import { Mark, mergeAttributes } from "@tiptap/core";

export const AUTO_LINK_SUPPRESSION_MARK = "autoLinkSuppression";

export const AutoLinkSuppression = Mark.create({
  name: AUTO_LINK_SUPPRESSION_MARK,
  inclusive: false,
  excludes: "link",

  parseHTML() {
    return [{ tag: "span[data-auto-link-suppression]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-auto-link-suppression": "" }), 0];
  },
});
