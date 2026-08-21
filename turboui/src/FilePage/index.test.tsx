import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { FilePage } from "./index";
import type { CommentSectionProps } from "../CommentSection";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import type { CurrentSubscriptions } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { asSubscriber, genPeople } from "../utils/storybook/genPeople";

jest.mock("../RichContent", () => ({
  __esModule: true,
  default: () => <div data-testid="rich-content">Description body</div>,
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
    IconDownload: HiddenIcon,
  };
});

const author = genPeople(1)[0]!;
const richTextHandlers = createMockRichEditorHandlers();

const subscriptions: CurrentSubscriptions.Props = {
  subscribers: [asSubscriber(author, { isSubscribed: true })],
  subscribedPeople: [asSubscriber(author, { isSubscribed: true })],
  isCurrentUserSubscribed: true,
  resourceName: "file",
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

const blob = {
  url: "https://example.com/launch-photo.jpg",
  contentType: "image/jpeg",
  width: 1200,
  height: 800,
};

const baseProps = {
  pageTitle: "Launch photo",
  navigation: [
    { to: "/spaces/space-1", label: "Product" },
    { to: "/resource-hubs/hub-1", label: "Documents & Files" },
  ],
  title: "Launch photo",
  author,
  postedAt: "2026-05-13T12:00:00Z",
  formattedTimePreferences: defaultFormattedTimePreferences,
  filename: "launch-photo.jpg",
  fileSize: "1MB",
  viewUrl: blob.url,
  onDownload: jest.fn(),
  blob,
  description: JSON.stringify(asRichText("Notes")),
  mentionedPersonLookup: richTextHandlers.mentionedPersonLookup,
};

describe("FilePage", () => {
  test("shows download, view, description, reactions, comments, and subscriptions when provided", () => {
    render(
      <MemoryRouter>
        <FilePage
          {...baseProps}
          testId="resource-hub-file-page"
          reactions={reactions}
          comments={comments}
          subscriptions={subscriptions}
          deleteModal={{
            isOpen: false,
            onClose: jest.fn(),
            fileName: "Launch photo",
            onConfirm: jest.fn(),
          }}
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="resource-hub-file-page"]')).toBeInTheDocument();
    expect(screen.getByText("Launch photo")).toBeInTheDocument();
    expect(screen.getByText("launch-photo.jpg (1MB)")).toBeInTheDocument();
    expect(screen.getByText("Download")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", blob.url);
    expect(screen.getByTestId("rich-content")).toBeInTheDocument();
    expect(screen.getByText("👍")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="add-comment"]')).toBeInTheDocument();
    expect(screen.getByText("You're subscribed")).toBeInTheDocument();
  });

  test("hides reactions, comments, subscriptions when hide flags are set", async () => {
    const user = userEvent.setup();
    const onDownload = jest.fn();

    render(
      <MemoryRouter>
        <FilePage
          {...baseProps}
          onDownload={onDownload}
          testId="project-template-file-page"
          hideReactions
          hideComments
          hideSubscriptions
          hideDeleteModal
        />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="project-template-file-page"]')).toBeInTheDocument();
    expect(screen.getByText("Download")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View" })).toBeInTheDocument();
    expect(screen.queryByText("👍")).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="add-comment"]')).not.toBeInTheDocument();
    expect(screen.queryByText("You're subscribed")).not.toBeInTheDocument();

    await user.click(screen.getByText("Download"));
    expect(onDownload).toHaveBeenCalled();
  });

  test("confirms deletion with a danger button", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <FilePage
          {...baseProps}
          hideReactions
          hideComments
          hideSubscriptions
          deleteModal={{
            isOpen: true,
            onClose: jest.fn(),
            fileName: "Launch photo",
            onConfirm,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Are you sure you want to delete the file/)).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="submit"]')).toHaveClass("bg-red-500");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
    });
  });
});
