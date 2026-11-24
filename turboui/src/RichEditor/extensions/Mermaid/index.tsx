import { CodeBlock, type CodeBlockOptions } from "@tiptap/extension-code-block";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { MermaidCodeBlockView } from "./MermaidCodeBlockView";
import { parseMermaidBlock } from "./parseMermaidBlock";

interface MermaidCodeBlockOptions extends CodeBlockOptions {
  renderMermaid: boolean;
  enableMermaidPaste: boolean;
}

export const MermaidCodeBlock = CodeBlock.extend<MermaidCodeBlockOptions>({
  addOptions() {
    const parentOptions = this.parent?.();
    if (!parentOptions) throw new Error("MermaidCodeBlock requires CodeBlock options");

    return {
      ...parentOptions,
      renderMermaid: true,
      enableMermaidPaste: true,
    };
  },

  addNodeView() {
    if (!this.options.renderMermaid) return null;

    return ReactNodeViewRenderer(MermaidCodeBlockView);
  },

  addProseMirrorPlugins() {
    const plugins = this.parent?.() ?? [];
    if (!this.options.enableMermaidPaste) return plugins;

    return [
      ...plugins,
      new Plugin({
        key: new PluginKey("mermaidCodeBlockPaste"),
        props: {
          handlePaste: (view, event) => {
            if (!event.clipboardData || view.state.selection.$from.parent.type === this.type) return false;

            const source = parseMermaidBlock(event.clipboardData.getData("text/plain"));
            if (source === null) return false;

            const content = source === "" ? undefined : view.state.schema.text(source);
            const codeBlock = this.type.create({ language: "mermaid" }, content);
            const transaction = view.state.tr.replaceSelectionWith(codeBlock);
            transaction.setSelection(
              TextSelection.near(
                transaction.doc.resolve(Math.min(transaction.selection.from, transaction.doc.content.size)),
              ),
            );
            transaction.setMeta("paste", true);
            view.dispatch(transaction.scrollIntoView());

            return true;
          },
        },
      }),
    ];
  },
});
