import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { AddFileWidget } from "./AddFileWidget";
import { NewFileModalsProvider, type NewFileModalsContextValue } from "./contexts/NewFileModalsContext";

const PREVIOUS_DESCRIPTION = "Notes from the previous PDF";

const richEditorMockState = {
  leftoverDraft: null as unknown,
};

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

jest.mock("../RichEditor", () => ({
  Editor: ({ editor }: { editor: { editor?: { getJSON?: () => unknown } } }) => (
    <div data-testid="rich-editor">{plainTextFromRichContent(editor?.editor?.getJSON?.())}</div>
  ),
  useEditor: (props: { content?: unknown; localDraft?: { key?: string; enabled?: boolean } }) => {
    const draftsEnabled = Boolean(props.localDraft?.key) && props.localDraft?.enabled !== false;
    const restored = draftsEnabled ? richEditorMockState.leftoverDraft : null;
    const content = restored ?? props.content ?? null;

    return {
      editor: {
        commands: { setContent: jest.fn() },
        getJSON: () => content,
      },
      localDraftRestored: Boolean(restored),
      clearLocalDraft: () => {
        richEditorMockState.leftoverDraft = null;
      },
    };
  },
}));

function plainTextFromRichContent(content: unknown): string {
  if (!content || typeof content !== "object") {
    return "";
  }

  const node = content as { text?: string; content?: unknown[] };
  const parts: string[] = [];

  if (typeof node.text === "string") {
    parts.push(node.text);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      parts.push(plainTextFromRichContent(child));
    }
  }

  return parts.join("");
}

function descriptionDraft(text: string) {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

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

function Harness({ onUpload }: { onUpload: React.ComponentProps<typeof AddFileWidget>["onUpload"] }) {
  const [files, setFiles] = React.useState<File[] | undefined>([
    new File(["hello world"], "Roadmap.pdf", { type: "application/pdf" }),
  ]);

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
      <button
        type="button"
        onClick={() => setFiles([new File(["budget"], "Budget.xlsx", { type: "application/vnd.ms-excel" })])}
      >
        Drop next file
      </button>
    </NewFileModalsProvider>
  );
}

describe("AddFileWidget", () => {
  beforeEach(() => {
    richEditorMockState.leftoverDraft = null;
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

  test("does not restore a leftover description draft for a newly selected file", async () => {
    richEditorMockState.leftoverDraft = descriptionDraft(PREVIOUS_DESCRIPTION);

    render(<Harness onUpload={async () => undefined} />);

    expect(await screen.findByDisplayValue("Roadmap")).toBeInTheDocument();
    expect(screen.queryByText(PREVIOUS_DESCRIPTION)).not.toBeInTheDocument();
  });

  test("starts a new upload with an empty description after cancel", async () => {
    richEditorMockState.leftoverDraft = descriptionDraft(PREVIOUS_DESCRIPTION);

    render(<Harness onUpload={async () => undefined} />);

    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Drop next file" }));

    expect(await screen.findByDisplayValue("Budget")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Roadmap")).not.toBeInTheDocument();
    expect(screen.queryByText(PREVIOUS_DESCRIPTION)).not.toBeInTheDocument();
  });

  test("discards the previous description when a new file is dropped onto an open upload form", async () => {
    richEditorMockState.leftoverDraft = descriptionDraft(PREVIOUS_DESCRIPTION);

    render(<Harness onUpload={async () => undefined} />);

    expect(await screen.findByDisplayValue("Roadmap")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Drop next file" }));

    expect(await screen.findByDisplayValue("Budget")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Roadmap")).not.toBeInTheDocument();
    expect(screen.queryByText(PREVIOUS_DESCRIPTION)).not.toBeInTheDocument();
  });

  test("starts a new upload with an empty description after a successful upload", async () => {
    richEditorMockState.leftoverDraft = descriptionDraft(PREVIOUS_DESCRIPTION);

    render(<Harness onUpload={async () => undefined} />);

    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByText("Uploading file")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Drop next file" }));

    expect(await screen.findByDisplayValue("Budget")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Roadmap")).not.toBeInTheDocument();
    expect(screen.queryByText(PREVIOUS_DESCRIPTION)).not.toBeInTheDocument();
  });
});
