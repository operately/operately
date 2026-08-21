import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";

import { DocumentPage } from "./index";
import type { CommentSectionProps } from "../CommentSection";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { asSubscriber, genPeople } from "../utils/storybook/genPeople";
import type { ResourceHubNodesListContextValue } from "../ResourceHub/contexts/NodesListContext";
import type { ResourceHubDocument } from "../ResourceHub/types";
import type { CurrentSubscriptions } from "../Subscriptions";

jest.mock("../RichContent", () => ({
  __esModule: true,
  default: ({ content }: { content: unknown }) => (
    <div data-testid="rich-content">{typeof content === "object" ? "Document body" : String(content)}</div>
  ),
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

const author = genPeople(1)[0]!;
const richTextHandlers = createMockRichEditorHandlers();

const subscriptions: CurrentSubscriptions.Props = {
  subscribers: [asSubscriber(author, { isSubscribed: true })],
  subscribedPeople: [asSubscriber(author, { isSubscribed: true })],
  isCurrentUserSubscribed: true,
  resourceName: "document",
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

const mockDocument: ResourceHubDocument = {
  __typename: "resource_hub_document",
  id: "doc-1",
  name: "Interview Guide",
  content: "{}",
  resourceHubId: "hub-1",
  parentFolderId: "",
  state: "published",
  insertedAt: "2026-05-13T12:00:00Z",
  publishedAt: "2026-05-13T12:00:00Z",
  updatedAt: "2026-05-13T12:00:00Z",
};

const mockCopyListContext: ResourceHubNodesListContextValue = {
  parent: { id: "hub-1", name: "Documents & Files", type: "resource_hub" },
  folderSelect: {
    loadFolder: async () => ({
      current: { type: "resourceHub", resourceHub: { id: "hub-1", name: "Documents & Files" } as never },
      nodes: [],
    }),
    loadResourceHub: async () => ({
      current: { type: "resourceHub", resourceHub: { id: "hub-1", name: "Documents & Files" } as never },
      nodes: [],
    }),
    compareIds: (a, b) => a === b,
  },
  actions: {},
};

const baseProps = {
  pageTitle: "Interview Guide",
  navigation: [
    { to: "/spaces/space-1", label: "Product" },
    { to: "/resource-hubs/hub-1", label: "Documents & Files" },
  ],
  title: "Interview Guide",
  author,
  state: "published",
  publishedAt: "2026-05-13T12:00:00Z",
  formattedTimePreferences: defaultFormattedTimePreferences,
  content: JSON.stringify(asRichText("Body")),
  mentionedPersonLookup: richTextHandlers.mentionedPersonLookup,
};

function renderPage(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("DocumentPage", () => {
  test("shows reactions, comments, subscriptions, and draft actions when provided", () => {
    renderPage(
      <DocumentPage
        {...baseProps}
        state="draft"
        publishedAt={undefined}
        draftActions={{
          state: "draft",
          updatedAt: "2026-05-14T12:00:00Z",
          editPath: "/documents/doc-1/edit",
          onPublish: jest.fn(),
          formattedTimePreferences: defaultFormattedTimePreferences,
        }}
        reactions={reactions}
        comments={comments}
        subscriptions={subscriptions}
        copyModal={{
          isOpen: false,
          onClose: jest.fn(),
          listContext: mockCopyListContext,
          document: mockDocument,
        }}
        deleteModal={{
          isOpen: false,
          onClose: jest.fn(),
          documentName: "Interview Guide",
          onConfirm: jest.fn(),
        }}
      />,
    );

    expect(screen.getByText("Interview Guide")).toBeInTheDocument();
    expect(screen.getByText("This is an unpublished draft.")).toBeInTheDocument();
    expect(screen.getByText("👍")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="add-comment"]')).toBeInTheDocument();
    expect(screen.getByText("You're subscribed")).toBeInTheDocument();
  });

  test("hides optional sections when hide flags are set", () => {
    renderPage(
      <DocumentPage
        {...baseProps}
        testId="project-template-document-page"
        hideDraftActions
        hideReactions
        hideComments
        hideSubscriptions
        hideCopyModal
        hideDeleteModal
      />,
    );

    expect(document.querySelector('[data-test-id="project-template-document-page"]')).toBeInTheDocument();
    expect(screen.queryByText("This is an unpublished draft.")).not.toBeInTheDocument();
    expect(screen.queryByText("👍")).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="add-comment"]')).not.toBeInTheDocument();
    expect(screen.queryByText("You're subscribed")).not.toBeInTheDocument();
  });

  test("calls onConfirm when deleting from the delete modal", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn().mockResolvedValue(undefined);

    renderPage(
      <DocumentPage
        {...baseProps}
        hideDraftActions
        hideReactions
        hideComments
        hideSubscriptions
        hideCopyModal
        deleteModal={{
          isOpen: true,
          onClose: jest.fn(),
          documentName: "Interview Guide",
          onConfirm,
        }}
      />,
    );

    expect(screen.getByText(/Are you sure you want to delete the document/)).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="submit"]')).toHaveClass("bg-red-500");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled();
    });
  });
});
