import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { LinkEditPage } from "./index";
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
  { to: "/links/link-1", label: "Design Spec" },
];

describe("LinkEditPage", () => {
  test("shows title, URL, notes fields and save action", () => {
    render(
      <MemoryRouter>
        <LinkEditPage
          pageTitle="Edit Link"
          navigation={navigation}
          testId="resource-hub-edit-link-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialTitle="Design Spec"
          initialUrl="https://www.figma.com/file/example"
          initialDescription={emptyContent()}
          cancelLink="/links/link-1"
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="resource-hub-edit-link-page"]')).toBeInTheDocument();
    expect(screen.getByLabelText("What do you want to call this link?")).toHaveValue("Design Spec");
    expect(screen.getByLabelText("Paste the link")).toHaveValue("https://www.figma.com/file/example");
    expect(screen.getByText("Notes (optional)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  test("renders template variant with custom page title", () => {
    render(
      <MemoryRouter>
        <LinkEditPage
          pageTitle={["Edit Link", "Launch Playbook"]}
          navigation={[
            { to: "/spaces/space-1", label: "Product" },
            { to: "/project-templates/template-1", label: "Launch Playbook" },
          ]}
          testId="project-template-edit-link-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialTitle="Design Spec"
          initialUrl="https://www.figma.com/file/example"
          initialDescription={emptyContent()}
          cancelLink="/project-templates/template-1?tab=docs-and-files"
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="project-template-edit-link-page"]')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
