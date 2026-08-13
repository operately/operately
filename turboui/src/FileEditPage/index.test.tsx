import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { FileEditPage } from "./index";
import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

jest.mock("../RichEditor", () => ({
  Editor: () => <div data-testid="rich-editor" />,
  useEditor: () => ({
    editor: {
      commands: { setContent: jest.fn() },
      getJSON: () => null,
    },
    localDraftRestored: false,
    clearLocalDraft: () => undefined,
  }),
}));

jest.mock("../icons", () => {
  const HiddenIcon = () => <span aria-hidden="true" />;

  return {
    IconDots: HiddenIcon,
    IconSearch: HiddenIcon,
    IconSlash: HiddenIcon,
    IconX: HiddenIcon,
  };
});

const navigation = [
  { to: "/spaces/space-1", label: "Product" },
  { to: "/resource-hubs/hub-1", label: "Documents & Files" },
  { to: "/files/file-1", label: "Launch photo.jpg" },
];

describe("FileEditPage", () => {
  test("shows title without extension, description editor, and save action", () => {
    render(
      <MemoryRouter>
        <FileEditPage
          pageTitle="Edit File"
          navigation={navigation}
          testId="resource-hub-edit-file-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialTitle="Launch photo.jpg"
          initialDescription={emptyContent()}
          cancelLink="/files/file-1"
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="resource-hub-edit-file-page"]')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Title...")).toHaveValue("Launch photo");
    expect(screen.getByTestId("rich-editor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  test("renders template variant with custom page title", () => {
    render(
      <MemoryRouter>
        <FileEditPage
          pageTitle={["Edit File", "Launch Playbook"]}
          navigation={[
            { to: "/spaces/space-1", label: "Product" },
            { to: "/project-templates/template-1", label: "Launch Playbook" },
          ]}
          testId="project-template-edit-file-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialTitle="Launch photo.jpg"
          initialDescription={emptyContent()}
          cancelLink="/project-templates/template-1/files/node-1"
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="project-template-edit-file-page"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
