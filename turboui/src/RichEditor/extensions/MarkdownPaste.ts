import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({ html: false, breaks: true }).disable("code");
// Images in the editor use the file upload flow. Keep their alt text when importing Markdown.
markdown.renderer.rules.image = (tokens, index) => markdown.utils.escapeHtml(tokens[index]?.content ?? "");

const blockFormatting = new Set([
  "heading_open",
  "bullet_list_open",
  "ordered_list_open",
  "blockquote_open",
  "fence",
  "hr",
  "table_open",
]);
const inlineFormatting = new Set(["strong_open", "em_open", "s_open", "code_inline", "link_open"]);

export const MarkdownPaste = Extension.create({
  name: "markdownPaste",
  // VS Code includes its language mode alongside the clipboard text, which normally triggers CodeBlock's paste handler.
  priority: 101,

  addProseMirrorPlugins() {
    let pasteWithoutFormatting = false;

    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            paste() {
              pasteWithoutFormatting = false;
              return false;
            },
          },
          transformPastedText(text, plain) {
            // ProseMirror reports the plain-paste shortcut while parsing the clipboard.
            pasteWithoutFormatting = plain;
            return text;
          },
          handlePaste(view, { clipboardData }, slice) {
            const preservePlainText = pasteWithoutFormatting;
            pasteWithoutFormatting = false;
            if (!clipboardData || clipboardData.files.length > 0) return false;

            const text = clipboardData.getData("text/plain");
            if (!text) return false;

            const { state } = view;
            const { $from } = state.selection;
            if ($from.parent.type.spec.code) return false;

            const vsCodeMetadata = clipboardData.getData("vscode-editor-data");
            const fromMarkdownFile = isVSCodeMarkdown(vsCodeMetadata);
            if (!preservePlainText && !fromMarkdownFile && (vsCodeMetadata || clipboardData.getData("text/html"))) {
              return false;
            }

            const marks = state.storedMarks ?? $from.marks();
            const inInlineCode = marks.some((mark) => mark.type.spec.code);
            if (inInlineCode || preservePlainText) {
              const transaction = inInlineCode
                ? state.tr.insertText(text.replace(/\r\n?/g, "\n"))
                : state.tr.replaceSelection(slice);

              // Insert literal text without running the editor's formatting paste rules.
              view.dispatch(transaction.setMeta("paste", true).scrollIntoView());
              return true;
            }

            const html = renderMarkdown(text);
            if (!html && !fromMarkdownFile) return false;

            // Reuse the editor's normal paste processing without the source clipboard metadata.
            const pasteEvent = Object.assign(new Event("paste"), { clipboardData: null });
            return html ? view.pasteHTML(html, pasteEvent) : view.pasteText(text, pasteEvent);
          },
        },
      }),
    ];
  },
});

function renderMarkdown(text: string): string | null {
  const env = {};
  const tokens = markdown.parse(text, env);
  const hasFormatting = tokens.some(
    (token) => blockFormatting.has(token.type) || token.children?.some((child) => inlineFormatting.has(child.type)),
  );
  if (!hasFormatting) return null;

  for (const token of tokens) {
    if (token.type === "fence") token.content = token.content.replace(/\n$/, "");
  }

  return markdown.renderer.render(tokens, markdown.options, env);
}

function isVSCodeMarkdown(metadata: string): boolean {
  if (!metadata) return false;

  try {
    return JSON.parse(metadata)?.mode === "markdown";
  } catch {
    return false;
  }
}
