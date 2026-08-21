import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { NewDocumentPage } from "./index";
import { SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asSubscriber, genPeople } from "../utils/storybook/genPeople";

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

const mockPeople = genPeople(3);

const mockSubscribers: SubscribersSelector.Subscriber[] = mockPeople.map((person) => asSubscriber(person));

const navigation = [
  { to: "/spaces/space-1", label: "Product" },
  { to: "/resource-hubs/hub-1", label: "Documents & Files" },
];

function subscriptionsProps(): SubscribersSelector.Props {
  return {
    subscribers: mockSubscribers,
    selectedSubscribers: [],
    onSelectedSubscribersChange: jest.fn(),
    subscriptionType: SubscribersSelector.SubscriptionOption.ALL,
    onSubscriptionTypeChange: jest.fn(),
    alwaysNotify: [],
    allSubscribersLabel: "Everyone who has access to Documents & Files",
  };
}

describe("NewDocumentPage", () => {
  test("shows subscriptions, draft action, and discard link", () => {
    render(
      <MemoryRouter>
        <NewDocumentPage
          pageTitle="New Document"
          navigation={navigation}
          testId="resource-hub-new-document-page"
          richTextHandlers={createMockRichEditorHandlers()}
          cancelLink="/resource-hubs/hub-1"
          subscriptions={subscriptionsProps()}
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="resource-hub-new-document-page"]')).toBeInTheDocument();
    expect(screen.getByText("When I post this, notify:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create document" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save as draft" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Discard this document" })).toHaveAttribute("href", "/resource-hubs/hub-1");
  });

  test("hides subscriptions and draft action when hide flags are set", () => {
    render(
      <MemoryRouter>
        <NewDocumentPage
          pageTitle={["New Document", "Launch Playbook"]}
          navigation={[
            { to: "/spaces/space-1", label: "Product" },
            { to: "/project-templates/template-1", label: "Launch Playbook" },
          ]}
          testId="project-template-new-document-page"
          richTextHandlers={createMockRichEditorHandlers()}
          cancelLink="/project-templates/template-1?tab=docs-and-files"
          hideSubscriptions
          hideDraftActions
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="project-template-new-document-page"]')).toBeInTheDocument();
    expect(screen.queryByText("When I post this, notify:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create document" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save as draft" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Discard this document" })).toHaveAttribute(
      "href",
      "/project-templates/template-1?tab=docs-and-files",
    );
  });
});
