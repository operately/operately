import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { LinkNewPage } from "./index";
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
    IconLink: HiddenIcon,
    IconSearch: HiddenIcon,
    IconSlash: HiddenIcon,
    IconX: HiddenIcon,
  };
});

jest.mock("../BrandIcons", () => {
  const Icon = () => <span aria-hidden="true" />;

  return {
    Airtable: Icon,
    Dropbox: Icon,
    Figma: Icon,
    GoogleLogo: Icon,
    GoogleDoc: Icon,
    GoogleSheets: Icon,
    GoogleSlides: Icon,
    Notion: Icon,
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

describe("LinkNewPage", () => {
  test("shows subscriptions and add link action", () => {
    render(
      <MemoryRouter>
        <LinkNewPage
          pageTitle="New Link"
          navigation={navigation}
          testId="resource-hub-new-link-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialType="other"
          cancelLink="/resource-hubs/hub-1"
          subscriptions={subscriptionsProps()}
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="resource-hub-new-link-page"]')).toBeInTheDocument();
    expect(screen.getByText("When I post this, notify:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add link" })).toBeInTheDocument();
    expect(screen.queryByText("What kind of document is this?")).not.toBeInTheDocument();
  });

  test("shows Google document type radios for Google initial types", () => {
    render(
      <MemoryRouter>
        <LinkNewPage
          pageTitle="New Link"
          navigation={navigation}
          testId="resource-hub-new-link-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialType="google_doc"
          cancelLink="/resource-hubs/hub-1"
          subscriptions={subscriptionsProps()}
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("What kind of document is this?")).toBeInTheDocument();
    expect(screen.getByText("Doc")).toBeInTheDocument();
    expect(screen.getByText("Sheet")).toBeInTheDocument();
  });

  test("hides subscriptions when hideSubscriptions is set", () => {
    render(
      <MemoryRouter>
        <LinkNewPage
          pageTitle={["New Link", "Launch Playbook"]}
          navigation={[
            { to: "/spaces/space-1", label: "Product" },
            { to: "/project-templates/template-1", label: "Launch Playbook" },
          ]}
          testId="project-template-new-link-page"
          richTextHandlers={createMockRichEditorHandlers()}
          initialType="figma"
          cancelLink="/project-templates/template-1?tab=docs-and-files"
          hideSubscriptions
          onSubmit={jest.fn().mockResolvedValue(true)}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="project-template-new-link-page"]')).toBeInTheDocument();
    expect(screen.queryByText("When I post this, notify:")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add link" })).toBeInTheDocument();
  });
});
