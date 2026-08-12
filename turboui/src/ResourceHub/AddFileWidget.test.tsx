import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

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

jest.mock("../RichEditor", () => ({
  Editor: () => <div data-testid="rich-editor" />,
  useEditor: (props: { content?: unknown }) => ({
    editor: {
      commands: { setContent: jest.fn() },
      getJSON: () => props.content ?? null,
    },
    localDraftRestored: false,
    clearLocalDraft: () => undefined,
  }),
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

function Harness({
  onUpload,
}: {
  onUpload: React.ComponentProps<typeof AddFileWidget>["onUpload"];
}) {
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
    </NewFileModalsProvider>
  );
}

describe("AddFileWidget", () => {
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
});
