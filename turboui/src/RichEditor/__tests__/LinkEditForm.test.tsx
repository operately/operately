import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { LinkEditForm } from "../LinkEditForm";
import { EditorContext } from "../EditorContext";
import FakeTextSelection from "../extensions/FakeTextSelection";
import { AutoLinkSuppression } from "../extensions/Link/AutoLinkSuppression";
import { normalizeRichTextContent } from "../richTextContent";

const setLinkEditActive = jest.fn();

// Wrapper component to provide the editor context
function TestEditor({ content, onEditorReady }: { content: string; onEditorReady: (editor: Editor) => void }) {
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ link: false }),
      Link.extend({ inclusive: false }).configure({ openOnClick: false }),
      AutoLinkSuppression,
      FakeTextSelection,
    ],
    content,
  });

  React.useEffect(() => {
    if (editor) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) return null;

  return (
    <EditorContext.Provider
      value={{
        editor,
        linkEditActive: true,
        setLinkEditActive,
        submittable: true,
        focused: true,
        empty: false,
        uploading: false,
        uploadFile: jest.fn(),
        setContent: jest.fn(),
        setFocused: jest.fn(),
        getJson: jest.fn(),
        localDraftRestored: false,
        clearLocalDraft: jest.fn(),
      }}
    >
      <EditorContent editor={editor} />
      <LinkEditForm editor={editor} />
    </EditorContext.Provider>
  );
}

describe("LinkEditForm", () => {
  let editorRef: Editor | null;

  const setup = (content: string) => {
    editorRef = null;
    return render(
      <TestEditor
        content={content}
        onEditorReady={(editor) => {
          editorRef = editor;
        }}
      />,
    );
  };

  it("updates the entire link when cursor is collapsed inside the link", async () => {
    setup('<p><a href="https://old.com">Linked Word</a></p>');

    // Wait for editor to be ready
    await screen.findByText("Linked Word");
    expect(editorRef?.getHTML()).toContain("https://old.com");

    // Place cursor in the middle of "Linked Word"
    // "Linked Word" starts at pos 1 (p) + 1 (start) = 2.
    // Length is 11.
    // Let's place it at pos 5.
    act(() => {
      editorRef?.commands.setTextSelection(5);
    });

    const input = screen.getByPlaceholderText("ex. https://example.com");
    fireEvent.change(input, { target: { value: "https://new.com" } });
    fireEvent.click(screen.getByText("Save"));

    expect(editorRef?.getHTML()).toContain(
      '<a target="_blank" rel="noopener noreferrer nofollow" href="https://new.com">Linked Word</a>',
    );
    expect(editorRef?.getHTML()).not.toContain("https://old.com");
  });

  it("updates the entire link when only part of the link is selected", async () => {
    setup('<p><a href="https://old.com">Linked Word</a></p>');

    await screen.findByText("Linked Word");
    expect(editorRef?.getHTML()).toContain("https://old.com");

    // Select "inked" inside "Linked Word"
    // L(2) i(3) n(4) k(5) e(6) d(7)
    act(() => {
      editorRef?.commands.setTextSelection({ from: 3, to: 8 });
    });

    const input = screen.getByPlaceholderText("ex. https://example.com");
    fireEvent.change(input, { target: { value: "https://new.com" } });
    fireEvent.click(screen.getByText("Save"));

    expect(editorRef?.getHTML()).toContain('href="https://new.com"');
    expect(editorRef?.getHTML()).not.toContain("https://old.com");
  });

  it("unlinks the entire link when cursor is collapsed inside the link", async () => {
    setup('<p><a href="https://old.com">Linked Word</a></p>');

    await screen.findByText("Linked Word");
    expect(editorRef?.getHTML()).toContain("https://old.com");

    // Place cursor inside
    act(() => {
      editorRef?.commands.setTextSelection(5);
    });

    fireEvent.click(screen.getByText("Unlink"));

    expect(editorRef?.getHTML()).not.toContain("<a ");
  });

  it("preserves an explicitly unlinked URL when saving and loading", async () => {
    setup('<p><a href="https://example.com">https://example.com</a></p>');

    await screen.findByText("https://example.com");
    act(() => {
      editorRef?.commands.setTextSelection(5);
    });

    fireEvent.click(screen.getByText("Unlink"));

    const saved = normalizeRichTextContent(editorRef?.getJSON());
    expect(JSON.stringify(saved)).not.toContain('"type":"link"');
    expect(JSON.stringify(saved)).toContain('"type":"autoLinkSuppression"');
    expect(normalizeRichTextContent(saved)).toBe(saved);
  });

  it("links only the selected text inside an explicitly unlinked range", async () => {
    setup('<p><a href="https://old.com">Linked Word</a></p>');

    await screen.findByText("Linked Word");
    act(() => {
      editorRef?.commands.setTextSelection(5);
    });
    fireEvent.click(screen.getByText("Unlink"));

    act(() => {
      editorRef?.commands.setTextSelection({ from: 8, to: 12 });
    });

    const input = screen.getByPlaceholderText("ex. https://example.com");
    fireEvent.change(input, { target: { value: "https://new.com" } });
    fireEvent.click(screen.getByText("Add"));

    const paragraph = editorRef?.getJSON().content?.[0];
    const linkedNodes = paragraph?.content?.filter((node) => node.marks?.some((mark) => mark.type === "link"));

    expect(linkedNodes).toEqual([
      expect.objectContaining({
        text: "Word",
        marks: expect.arrayContaining([
          expect.objectContaining({ type: "link", attrs: expect.objectContaining({ href: "https://new.com" }) }),
        ]),
      }),
    ]);
  });

  it("unlinks the entire link when only part of the link is selected", async () => {
    setup('<p><a href="https://old.com">Linked Word</a></p>');

    await screen.findByText("Linked Word");
    expect(editorRef?.getHTML()).toContain("https://old.com");

    // Select part of the word
    act(() => {
      editorRef?.commands.setTextSelection({ from: 3, to: 8 });
    });

    fireEvent.click(screen.getByText("Unlink"));

    expect(editorRef?.getHTML()).not.toContain("<a ");
  });

  it("creates a new link on selected text correctly", async () => {
    setup("<p>Some Text</p>");

    await screen.findByText("Some Text");

    // Select "Text"
    // S(2) o(3) m(4) e(5)  (6) T(7) e(8) x(9) t(10)
    act(() => {
      editorRef?.commands.setTextSelection({ from: 7, to: 11 });
    });

    const input = screen.getByPlaceholderText("ex. https://example.com");
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByText("Add"));

    expect(editorRef?.getHTML()).toContain('href="https://example.com"');
  });

  it("updates a link in a complex document structure (div with multiple paragraphs)", async () => {
    // Tiptap (ProseMirror) will unwrap the div since it's not in the default schema,
    // but the paragraphs will remain as top-level blocks.
    // P1: "First paragraph..." (Length: 32)
    // P2: "Second paragraph with a target link in the middle."
    //      Prefix: "Second paragraph with a " (Length: 24)
    //      Link: "target link" (Length: 11)
    const complexContent = `
      <div>
        <p>First paragraph with some content.</p>
        <p>Second paragraph with a <a href="https://old.com">target link</a> in the middle.</p>
      </div>
    `;
    setup(complexContent);

    await screen.findByText("First paragraph with some content.");
    expect(editorRef?.getHTML()).toContain("https://old.com");

    // Calculate position:
    // Pos 0: doc start
    // Pos 1: p1 start
    // Pos 2: p1 content start. Length 32.
    // Pos 34: p1 end
    // Pos 35: p2 start
    // Pos 36: p2 content start.
    // Target is inside "target link".
    // "Second paragraph with a " is 24 chars.
    // Start of "target link" is 36 + 24 = 60.
    // Let's place cursor at 62.
    act(() => {
      editorRef?.commands.setTextSelection(62);
    });

    const input = screen.getByPlaceholderText("ex. https://example.com");
    fireEvent.change(input, { target: { value: "https://updated-in-complex.com" } });
    fireEvent.click(screen.getByText("Save"));

    expect(editorRef?.getHTML()).toContain('href="https://updated-in-complex.com"');
    expect(editorRef?.getHTML()).toContain("First paragraph with some content.");
    expect(editorRef?.getHTML()).toContain("Second paragraph with a");
  });
});
