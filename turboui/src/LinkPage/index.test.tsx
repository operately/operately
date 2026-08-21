import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { LinkPage } from "./index";
import type { CommentSectionProps } from "../CommentSection";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import type { CurrentSubscriptions } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { asSubscriber, genPeople } from "../utils/storybook/genPeople";

jest.mock("../RichContent", () => ({
  __esModule: true,
  default: () => <div data-testid="rich-content">Notes body</div>,
  isContentEmpty: (content: unknown) => content == null || content === "",
}));

jest.mock("../icons", () => {
  const HiddenIcon = () => <span aria-hidden="true" />;
  return {
    IconDots: HiddenIcon,
    IconSearch: HiddenIcon,
    IconSlash: HiddenIcon,
    IconX: HiddenIcon,
    IconMoodPlus: HiddenIcon,
    IconTrash: HiddenIcon,
    IconEdit: HiddenIcon,
    IconLink: HiddenIcon,
  };
});

jest.mock("../BrandIcons", () => {
  const Icon = () => <span aria-hidden="true" data-testid="link-icon" />;
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

const author = genPeople(1)[0]!;
const richTextHandlers = createMockRichEditorHandlers();

const subscriptions: CurrentSubscriptions.Props = {
  subscribers: [asSubscriber(author, { isSubscribed: true })],
  subscribedPeople: [asSubscriber(author, { isSubscribed: true })],
  isCurrentUserSubscribed: true,
  resourceName: "link",
  onSubscribe: jest.fn(),
  onUnsubscribe: jest.fn(),
  onEditSubscribers: jest.fn(),
  canEditSubscribers: true,
};

const reactions = {
  reactions: [
    {
      id: "reaction-1",
      emoji: "👍",
      person: {
        id: author.id,
        fullName: author.fullName,
        avatarUrl: author.avatarUrl ?? null,
        profileLink: "#",
      },
    },
  ],
  size: 24,
  canAddReaction: true,
};

const comments: CommentSectionProps = {
  items: [],
  currentUser: {
    id: author.id,
    fullName: author.fullName,
    avatarUrl: author.avatarUrl ?? null,
    profileLink: "#",
  },
  canComment: true,
  onAddComment: jest.fn(),
  onEditComment: jest.fn(),
  richTextHandlers,
  formattedTimePreferences: defaultFormattedTimePreferences,
};

const baseProps = {
  pageTitle: "Design Spec",
  navigation: [
    { to: "/spaces/space-1", label: "Product" },
    { to: "/resource-hubs/hub-1", label: "Documents & Files" },
  ],
  linkType: "figma" as const,
  title: "Design Spec",
  url: "https://www.figma.com/file/example",
  author,
  postedAt: "2026-05-13T12:00:00Z",
  formattedTimePreferences: defaultFormattedTimePreferences,
  description: JSON.stringify(asRichText("Notes")),
  mentionedPersonLookup: richTextHandlers.mentionedPersonLookup,
};

describe("LinkPage", () => {
  test("shows open link, notes, reactions, comments, and subscriptions when provided", () => {
    render(
      <MemoryRouter>
        <LinkPage
          {...baseProps}
          testId="resource-hub-link-page"
          reactions={reactions}
          comments={comments}
          subscriptions={subscriptions}
          deleteModal={{
            isOpen: false,
            onClose: jest.fn(),
            linkName: "Design Spec",
            onConfirm: jest.fn(),
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="resource-hub-link-page"]')).toBeInTheDocument();
    expect(screen.getByText("Design Spec")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Link" })).toHaveAttribute("href", "https://www.figma.com/file/example");
    expect(screen.getByText("Notes:")).toBeInTheDocument();
    expect(screen.getByText("👍")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="add-comment"]')).toBeInTheDocument();
    expect(screen.getByText("You're subscribed")).toBeInTheDocument();
  });

  test("hides reactions, comments, subscriptions when hide flags are set", () => {
    render(
      <MemoryRouter>
        <LinkPage
          {...baseProps}
          testId="project-template-link-page"
          hideReactions
          hideComments
          hideSubscriptions
          hideDeleteModal
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="project-template-link-page"]')).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Link" })).toBeInTheDocument();
    expect(screen.queryByText("👍")).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="add-comment"]')).not.toBeInTheDocument();
    expect(screen.queryByText("You're subscribed")).not.toBeInTheDocument();
  });

  test("confirms deletion with a danger button", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <LinkPage
          {...baseProps}
          hideReactions
          hideComments
          hideSubscriptions
          deleteModal={{
            isOpen: true,
            onClose: jest.fn(),
            linkName: "Design Spec",
            onConfirm,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Are you sure you want to delete the link/)).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="submit"]')).toHaveClass("bg-red-500");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
    });
  });
});
