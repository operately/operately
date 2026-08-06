//
// Block-level markdown paste rules.
//
// TipTap ships paste rules for the inline marks (bold, italic, strike, code,
// link, and our custom Highlight), but NOT for block nodes created via
// input rules (headings, blockquote, lists, code block). This extension adds
// the missing paste-rule equivalents so that pasting raw markdown converts
// identically to typing it (see markdownInputRules / markdownPasteRules tests).
//
// The regexes mirror the input rules configured in createRichEditorExtensions
// and StarterKit, but drop the trailing end-of-input anchor (`$`) and use the
// global flag required by TipTap's paste-rule matcher.
//
import { callOrReturn, Extension, PasteRule } from "@tiptap/core";
import type { NodeType } from "@tiptap/pm/model";
import { canJoin, findWrapping } from "@tiptap/pm/transform";

type PasteRuleConfig = {
  find: RegExp;
  type: NodeType;
  getAttributes?: Record<string, any> | ((match: RegExpMatchArray) => Record<string, any> | undefined);
};

// Paste equivalent of `textblockTypeInputRule` (heading, code block).
function textblockTypePasteRule(config: PasteRuleConfig): PasteRule {
  return new PasteRule({
    find: config.find,
    handler: ({ state, range, match }) => {
      const attributes = callOrReturn(config.getAttributes, undefined, match) || {};
      const $start = state.doc.resolve(range.from);
      if (!$start.node(-1).canReplaceWith($start.index(-1), $start.indexAfter(-1), config.type)) {
        return null;
      }
      state.tr.delete(range.from, range.to).setBlockType(range.from, range.from, config.type, attributes);
      return undefined;
    },
  });
}

// Paste equivalent of `wrappingInputRule` (blockquote, bullet/ordered list).
function wrappingPasteRule(config: PasteRuleConfig): PasteRule {
  return new PasteRule({
    find: config.find,
    handler: ({ state, range, match }) => {
      const attributes = callOrReturn(config.getAttributes, undefined, match) || {};
      const tr = state.tr.delete(range.from, range.to);
      const $start = tr.doc.resolve(range.from);
      const blockRange = $start.blockRange();
      const wrapping = blockRange && findWrapping(blockRange, config.type, attributes);
      if (!wrapping) {
        return null;
      }
      tr.wrap(blockRange, wrapping);
      const before = tr.doc.resolve(range.from - 1).nodeBefore;
      if (before && before.type === config.type && canJoin(tr.doc, range.from - 1)) {
        tr.join(range.from - 1);
      }
      return undefined;
    },
  });
}

const MarkdownBlockPasteRules = Extension.create({
  name: "markdownBlockPasteRules",

  addPasteRules() {
    const { nodes } = this.editor.schema;
    const rules: PasteRule[] = [];

    if (nodes.heading) {
      // H1/H2 only, matching the input rule in createRichEditorExtensions.
      rules.push(
        textblockTypePasteRule({
          find: /^(#{1,2})\s/g,
          type: nodes.heading,
          getAttributes: (match) => ({ level: match[1]!.length }),
        }),
      );
    }

    if (nodes.codeBlock) {
      rules.push(
        textblockTypePasteRule({
          find: /^```([a-z]+)?\s/g,
          type: nodes.codeBlock,
          getAttributes: (match) => ({ language: match[1] }),
        }),
      );
    }

    if (nodes.blockquote) {
      rules.push(
        wrappingPasteRule({
          find: /^\s*>\s/g,
          type: nodes.blockquote,
        }),
      );
    }

    if (nodes.bulletList) {
      rules.push(
        wrappingPasteRule({
          find: /^\s*([-+*])\s/g,
          type: nodes.bulletList,
        }),
      );
    }

    if (nodes.orderedList) {
      // Preserve the starting index (e.g. "2." -> start: 2), mirroring
      // StarterKit's orderedList input rule (`getAttributes: { start: +match[1] }`).
      rules.push(
        wrappingPasteRule({
          find: /^(\d+)\.\s/g,
          type: nodes.orderedList,
          getAttributes: (match) => ({ start: Number(match[1]) || 1 }),
        }),
      );
    }

    return rules;
  },
});

export default MarkdownBlockPasteRules;
