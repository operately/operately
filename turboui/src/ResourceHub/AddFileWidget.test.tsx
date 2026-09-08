import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  isRichTextEmpty,
  readLocalDraft,
  writeLocalDraft,
  clearLocalDraft as clearStoredLocalDraft,
} from "../RichEditor/localDrafts";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { AddFileWidget } from "./AddFileWidget";
import { NewFileModalsProvider, type NewFileModalsContextValue } from "./contexts/NewFileModalsContext";

jest.mock("../icons", () => {
  const HiddenIcon = () => <span aria-hidden="true" />;

  return {
    IconAlignJustified: HiddenIcon,
    IconArrowLeft: HiddenIcon,
    IconChartColumn: HiddenIcon,
    IconCheck: HiddenIcon,
    IconChevronDown: HiddenIcon,
    IconChevronRight: HiddenIcon,
    IconDots: HiddenIcon,
    IconFile: HiddenIcon,
    IconFolderFilled: HiddenIcon,
    IconLink: HiddenIcon,
    IconLogs: HiddenIcon,
    IconSearch: HiddenIcon,
    IconUpload: HiddenIcon,
    IconVideo: HiddenIcon,
    IconX: HiddenIcon,
  };
});

// A faithful-enough fake of the real `RichEditor` module: it backs the local
// draft autosave with the real `readLocalDraft`/`writeLocalDraft`/
// `clearLocalDraft` implementations (which read/write `window.localStorage`),
// so tests can exercise the draft-leakage regression end-to-end without
// pulling in the real tiptap editor.
function textToJson(text: string) {
  if (!text) {
    return { type: "doc", content: [{ type: "paragraph" }] };
  }

  return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] };
}

function jsonToText(json: unknown): string {
  if (isRichTextEmpty(json)) return "";

  const doc = json as { content?: Array<{ content?: Array<{ text?: string }> }> };
  return doc.content?.[0]?.content?.[0]?.text ?? "";
}

function useFakeEditor(props: {
  content?: unknown;
  localDraft?: { key?: string };
  onUpdate?: (data: { json: unknown; html: string }) => void;
}) {
  const baseContent = React.useRef(props.content ?? null).current;
  const [restored] = React.useState(() => readLocalDraft(props.localDraft, baseContent));
  const [json, setJson] = React.useState(() => restored ?? baseContent);

  const editor = {
    commands: { setContent: (content: unknown) => setJson(content) },
    getJSON: () => json,
  };

  const applyUserInput = (text: string) => {
    const content = textToJson(text);
    setJson(content);
    writeLocalDraft(props.localDraft, content, baseContent);
    props.onUpdate?.({ json: content, html: text });
  };

  return {
    editor,
    applyUserInput,
    localDraftRestored: restored !== null,
    clearLocalDraft: () => clearStoredLocalDraft(props.localDraft),
  };
}

jest.mock("../RichEditor", () => ({
  Editor: ({ editor }: { editor: ReturnType<typeof useFakeEditor> }) => (
    <textarea
      data-testid="rich-editor"
      value={jsonToText(editor.editor.getJSON())}
      onChange={(event) => editor.applyUserInput(event.target.value)}
    />
  ),
  useEditor: (props: Parameters<typeof useFakeEditor>[0]) => useFakeEditor(props),
}));

function buildSubscriptions(): React.ComponentProps<typeof AddFileWidget>["subscriptions"] {
  return {
    subscribers: [],
    selectedSubscribers: [],
    onSelectedSubscribersChange: jest.fn(),
    subscriptionType: "all" as any,
    onSubscriptionTypeChange: jest.fn(),
    alwaysNotify: [],
    allSubscribersLabel: "Everyone",
  };
}

export interface HarnessHandle {
  /** Simulates dropping a new set of files into the widget (replacing any current selection). */
  dropFiles: (files: File[]) => void;
}

const Harness = React.forwardRef<
  HarnessHandle,
  {
    onUpload: React.ComponentProps<typeof AddFileWidget>["onUpload"];
    initialFiles?: File[];
  }
>(function Harness(
  { onUpload, initialFiles = [new File(["hello world"], "Roadmap.pdf", { type: "application/pdf" })] },
  ref,
) {
  const [files, setFiles] = React.useState<File[] | undefined>(initialFiles);

  React.useImperativeHandle(ref, () => ({
    dropFiles: (newFiles: File[]) => setFiles(newFiles),
  }));

  const value = React.useMemo<NewFileModalsContextValue>(
    () => ({
      showAddFolder: false,
      toggleShowAddFolder: () => undefined,
      navigateToNewDocument: () => undefined,
      navigateToNewLink: () => undefined,
      files,
      setFiles,
      selectFiles: () => undefined,
      filesSelected: Boolean(files?.length),
    }),
    [files],
  );

  return (
    <NewFileModalsProvider value={value}>
      <AddFileWidget
        subscriptions={buildSubscriptions()}
        richTextHandlers={createMockRichEditorHandlers()}
        formatFileSize={(size) => `${size} bytes`}
        onUpload={onUpload}
      />
    </NewFileModalsProvider>
  );
});

function pdfFile(name: string): File {
  return new File(["hello world"], name, { type: "application/pdf" });
}

function draftKeysInStorage(): string[] {
  return Object.keys(window.localStorage).filter((key) => key.includes("resource-hub-add-file:"));
}

describe("AddFileWidget", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("renders selected file details and editable file names", async () => {
    render(<Harness onUpload={async () => undefined} />);

    expect(await screen.findByDisplayValue("Roadmap")).toBeInTheDocument();
    expect(screen.getByText("Roadmap.pdf")).toBeInTheDocument();
    expect(screen.getByText("11 bytes")).toBeInTheDocument();
  });

  test("shows the upload progress modal while uploads are in flight", async () => {
    let resolveUpload: (() => void) | undefined;
    const onUpload = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveUpload = resolve;
        }),
    );

    render(<Harness onUpload={onUpload} />);

    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Uploading file")).toBeInTheDocument();

    resolveUpload?.();

    await waitFor(() => expect(screen.queryByText("Uploading file")).not.toBeInTheDocument());
  });

  describe("local draft leakage regression", () => {
    test("a note typed for a successfully uploaded file does not leak into the next dropped file", async () => {
      const ref = React.createRef<HarnessHandle>();
      const onUpload = jest.fn().mockResolvedValue(undefined);

      render(<Harness ref={ref} onUpload={onUpload} initialFiles={[pdfFile("A.pdf")]} />);

      const noteForA = await screen.findByTestId("rich-editor");
      fireEvent.change(noteForA, { target: { value: "Notes about A" } });

      await waitFor(() => expect(draftKeysInStorage()).toHaveLength(1));

      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.queryByTestId("rich-editor")).not.toBeInTheDocument());

      // The uploaded file's note is discarded from storage immediately, not
      // just orphaned until it eventually expires.
      expect(draftKeysInStorage()).toHaveLength(0);

      act(() => ref.current!.dropFiles([pdfFile("B.pdf")]));

      const noteForB = await screen.findByTestId("rich-editor");
      expect(noteForB).toHaveValue("");
      expect(draftKeysInStorage()).toHaveLength(0);
    });

    test("clicking Cancel discards the typed note instead of leaving it for the next dropped file", async () => {
      const ref = React.createRef<HarnessHandle>();

      render(<Harness ref={ref} onUpload={jest.fn()} initialFiles={[pdfFile("A.pdf")]} />);

      const noteForA = await screen.findByTestId("rich-editor");
      fireEvent.change(noteForA, { target: { value: "Notes about A" } });

      await waitFor(() => expect(draftKeysInStorage()).toHaveLength(1));

      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(draftKeysInStorage()).toHaveLength(0);

      act(() => ref.current!.dropFiles([pdfFile("B.pdf")]));

      const noteForB = await screen.findByTestId("rich-editor");
      expect(noteForB).toHaveValue("");
    });

    test("removing a file from a multi-file selection does not leak its note into the file that takes its place", async () => {
      const fileA = pdfFile("A.pdf");
      const fileB = pdfFile("B.pdf");

      const { container } = render(<Harness onUpload={jest.fn()} initialFiles={[fileA, fileB]} />);

      const notes = await screen.findAllByTestId("rich-editor");
      expect(notes).toHaveLength(2);

      // Type a note only on the first file (A).
      fireEvent.change(notes[0]!, { target: { value: "Notes about A" } });
      await waitFor(() => expect(draftKeysInStorage()).toHaveLength(1));

      // Remove A. B shifts from index 1 down to index 0, reusing the
      // `items[0].description` field path that used to belong to A.
      const removeButtons = container.querySelectorAll(".bg-red-500");
      expect(removeButtons).toHaveLength(2);
      fireEvent.click(removeButtons[0]!);

      await waitFor(() => expect(screen.getAllByTestId("rich-editor")).toHaveLength(1));

      const remainingNote = screen.getByTestId("rich-editor");
      expect(remainingNote).toHaveValue("");
    });
  });
});
