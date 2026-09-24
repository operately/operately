import type { PasteRule } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import { Fragment, Slice, type MarkType, type Node } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";

export default Link.extend({
  inclusive: false,
  addPasteRules() {
    // Detect URLs before insertion, including content copied from ProseMirror,
    // which Tiptap deliberately excludes from its post-insertion paste rules.
    return [];
  },
  addProseMirrorPlugins() {
    const rules = Link.config.addPasteRules?.call({ ...this, parent: undefined }) ?? [];

    return [...(this.parent?.() ?? []), createPasteLinkPlugin(this.type, rules)];
  },
}).configure({
  openOnClick: false,
  markdownLinks: true,
});

function createPasteLinkPlugin(linkType: MarkType, rules: PasteRule[]): Plugin {
  function transformContent(content: Fragment): Fragment {
    const nodes: Node[] = [];

    content.forEach((node) => {
      if (node.type.spec.code) {
        nodes.push(node);
      } else if (node.isText) {
        nodes.push(...linkText(node));
      } else {
        nodes.push(node.copy(transformContent(node.content)));
      }
    });

    return Fragment.fromArray(nodes);
  }

  function linkText(node: Node): Node[] {
    if (node.marks.some((mark) => mark.type === linkType || mark.type.spec.code || mark.type.excludes(linkType))) {
      return [node];
    }

    // Reuse Tiptap's URL validation and Markdown-aware matching. Discard
    // replacements so pasted Markdown syntax stays literal.
    const matches = rules
      .flatMap((rule) => (typeof rule.find === "function" ? (rule.find(node.text ?? "") ?? []) : []))
      .filter((match) => match.replaceWith === undefined)
      .sort((a, b) => a.index - b.index);

    const nodes: Node[] = [];
    let offset = 0;

    for (const match of matches) {
      if (match.index > offset) nodes.push(node.cut(offset, match.index));
      offset = match.index + match.text.length;
      const marks = linkType.create({ href: match.data?.href }).addToSet(node.marks);
      nodes.push(node.cut(match.index, offset).mark(marks));
    }

    if (offset < node.nodeSize) nodes.push(node.cut(offset));
    return nodes;
  }

  return new Plugin({
    props: {
      transformPasted: (slice) => new Slice(transformContent(slice.content), slice.openStart, slice.openEnd),
    },
  });
}
