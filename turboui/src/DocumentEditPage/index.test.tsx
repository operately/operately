import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { DocumentEditPage } from "./index";
import { SubscribersSelector } from "../Subscriptions";
import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { genPeople } from "../utils/storybook/genPeople";

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

const mockSubscribers: SubscribersSelector.Subscriber[] = mockPeople.map((person) => ({
  person,
  isSubscribed: false,
  priority: false,
  role: null,
}));

const navigation = [
  { to: "/spaces/space-1", label: "Product" },
  { to: "/resource-hubs/hub-1", label: "Documents & Files" },
  { to: "/documents/doc-1", label: "Launch Checklist" },
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

describe("DocumentEditPage", () => {
  test("shows subscriptions, publish action, and save/cancel for drafts", () => {
    render(
      <MemoryRouter>
        <DocumentEditPage
          pageTitle="Edit Document"
          navigation={navigation}
          testId="resource-hub-edit-document-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialTitle="Launch Checklist"
          initialContent={emptyContent()}
          cancelLink="/documents/doc-1"
          subscriptions={subscriptionsProps()}
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="resource-hub-edit-document-page"]')).toBeInTheDocument();
    expect(screen.getByText("When I post this, notify:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish Now" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  test("hides subscriptions and publish action when hide flags are set", () => {
    render(
      <MemoryRouter>
        <DocumentEditPage
          pageTitle={["Edit Document", "Launch Playbook"]}
          navigation={[
            { to: "/spaces/space-1", label: "Product" },
            { to: "/project-templates/template-1", label: "Launch Playbook" },
          ]}
          testId="project-template-edit-document-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialTitle="Launch Checklist"
          initialContent={emptyContent()}
          cancelLink="/project-templates/template-1/documents/node-1"
          hideSubscriptions
          hidePublishAction
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="project-template-edit-document-page"]')).toBeInTheDocument();
    expect(screen.queryByText("When I post this, notify:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish Now" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
