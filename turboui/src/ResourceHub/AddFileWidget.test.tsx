import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { AddFileWidget } from "./AddFileWidget";
import { NewFileModalsProvider, type NewFileModalsContextValue } from "./contexts/NewFileModalsContext";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

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

const localDrafts: Record<string, unknown> = {};

jest.mock("../RichEditor", () => ({
  Editor: () => <div data-testid="rich-editor" />,
  useEditor: (props: { content?: unknown; localDraft?: { key?: string; enabled?: boolean } }) => {
    const draftKey = props.localDraft?.enabled === false ? undefined : props.localDraft?.key;
    const restoredDraft = draftKey ? localDrafts[draftKey] : undefined;

    return {
      editor: {
        commands: { setContent: jest.fn() },
        getJSON: () => restoredDraft ?? props.content ?? null,
      },
      localDraftRestored: Boolean(restoredDraft),
      clearLocalDraft: () => {
        if (draftKey) {
          delete localDrafts[draftKey];
        }
      },
    };
  },
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

const previousDescriptionDraft = {
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text: "Notes from the previous file" }] }],
};

function pdfFile(name: string, contents: string) {
  return new File([contents], name, { type: "application/pdf" });
}

function Harness({
  onUpload,
  initialFiles,
}: {
  onUpload: React.ComponentProps<typeof AddFileWidget>["onUpload"];
  initialFiles?: File[];
}) {
  const [files, setFiles] = React.useState<File[] | undefined>(initialFiles ?? [pdfFile("Roadmap.pdf", "hello world")]);

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
      <button type="button" onClick={() => setFiles([pdfFile("Budget.pdf", "budget")])}>
        Select next file
      </button>
      <AddFileWidget
        subscriptions={buildSubscriptions()}
        richTextHandlers={createMockRichEditorHandlers()}
        formatFileSize={(size) => `${size} bytes`}
        onUpload={onUpload}
      />
    </NewFileModalsProvider>
  );
}

function seedPreviousDescriptionDraft() {
  localDrafts[`form:${window.location.pathname}:items[0].description`] = previousDescriptionDraft;
}

describe("AddFileWidget", () => {
  test("looks up upload validation and progress without translating the file name", async () => {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        "Name is required": "Translated required file name",
        "File:": "Translated file:",
        "Uploading file_one": "Expanded translated upload progress",
      },
      true,
      true,
    );
    let finishUpload: (() => void) | undefined;
    const onUpload = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishUpload = resolve;
        }),
    );
    render(<Harness onUpload={onUpload} />);
    expect(screen.getByText("Translated file:")).toBeInTheDocument();
    const input = await screen.findByDisplayValue("Roadmap");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Translated required file name")).toBeInTheDocument();
    expect(onUpload).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "Roadmap" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Expanded translated upload progress")).toBeInTheDocument();
    expect(onUpload).toHaveBeenCalledWith(
      [expect.objectContaining({ name: "Roadmap", nameWithExtension: "Roadmap.pdf" })],
      expect.any(Function),
    );
    finishUpload?.();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  test.each([0, 1, 3])("preserves English upload states for %i files with missing Portuguese", async (count) => {
    i18n.removeResourceBundle("pt-BR", "translation");
    await i18n.changeLanguage("pt-BR");
    let finishUpload: (() => void) | undefined;
    const onUpload = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finishUpload = resolve;
        }),
    );
    render(
      <Harness
        initialFiles={Array.from({ length: count }, (_, index) => pdfFile(`Plan-${index}.pdf`, "plan"))}
        onUpload={onUpload}
      />,
    );
    if (count === 0) {
      expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
      expect(onUpload).not.toHaveBeenCalled();
      return;
    }
    fireEvent.click(await screen.findByRole("button", { name: "Save" }));
    expect(await screen.findByText(count === 1 ? "Uploading file" : "Uploading files")).toBeInTheDocument();
    finishUpload?.();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  afterEach(() => {
    Object.keys(localDrafts).forEach((key) => {
      delete localDrafts[key];
    });
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

  test("does not restore a previous file's description on a new upload", async () => {
    seedPreviousDescriptionDraft();
    const onUpload = jest.fn(async () => undefined);

    render(<Harness onUpload={onUpload} />);

    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    expect(onUpload).toHaveBeenCalledWith(
      [expect.objectContaining({ description: { type: "doc", content: [{ type: "paragraph" }] } })],
      expect.any(Function),
    );
  });

  test("discards title and description when canceling an upload", async () => {
    render(<Harness onUpload={async () => undefined} />);

    const titleInput = await screen.findByDisplayValue("Roadmap");
    fireEvent.change(titleInput, { target: { value: "Edited roadmap" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByDisplayValue("Edited roadmap")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Select next file" }));

    expect(await screen.findByDisplayValue("Budget")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Edited roadmap")).not.toBeInTheDocument();
  });

  test("starts a new upload without the previous file's title after a successful upload", async () => {
    const onUpload = jest.fn(async () => undefined);

    render(<Harness onUpload={onUpload} />);

    fireEvent.click(await screen.findByRole("button", { name: "Save" }));
    await waitFor(() => expect(onUpload).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByDisplayValue("Roadmap")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Select next file" }));

    expect(await screen.findByDisplayValue("Budget")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Roadmap")).not.toBeInTheDocument();
  });
});
