import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { DocumentPage } from "./index";
import { CurrentSubscriptions } from "../Subscriptions";
import { SubscribersSelector } from "../Subscriptions";
import type { CommentSectionProps } from "../CommentSection";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { genPeople } from "../utils/storybook/genPeople";
import type { ResourceHubNodesListContextValue } from "../ResourceHub/contexts/NodesListContext";
import type { ResourceHubDocument } from "../ResourceHub/types";

const meta = {
  title: "Pages/DocumentPage",
  component: DocumentPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/documents/doc-1",
      routePath: "/documents/:id",
    },
  },
} satisfies Meta<typeof DocumentPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const people = genPeople(4);
const author = people[0]!;
const commentAuthor = people[1]!;
const richTextHandlers = createMockRichEditorHandlers();

const mockSubscribers: SubscribersSelector.Subscriber[] = people.map((person) => ({
  person,
  isSubscribed: true,
  priority: false,
  role: null,
}));

const navigation = [
  { to: "/spaces/space-1", label: "Product" },
  { to: "/resource-hubs/hub-1", label: "Documents & Files" },
];

const mockDocument: ResourceHubDocument = {
  __typename: "resource_hub_document",
  id: "doc-1",
  name: "Interview Guide",
  content: JSON.stringify(asRichText("How we interview candidates.")),
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

const subscriptionsProps: CurrentSubscriptions.Props = {
  subscribers: mockSubscribers,
  subscribedPeople: mockSubscribers,
  isCurrentUserSubscribed: true,
  resourceName: "document",
  onSubscribe: () => console.log("subscribe"),
  onUnsubscribe: () => console.log("unsubscribe"),
  onEditSubscribers: (ids) => console.log("edit", ids),
  canEditSubscribers: true,
};

const reactionsProps = {
  reactions: [
    {
      id: "reaction-1",
      emoji: "👍",
      person: {
        id: people[1]!.id,
        fullName: people[1]!.fullName,
        avatarUrl: people[1]!.avatarUrl ?? null,
        profileLink: "#",
      },
    },
  ],
  size: 24,
  canAddReaction: true,
  onAddReaction: async (emoji: string) => console.log("add", emoji),
  onRemoveReaction: async (id: string) => console.log("remove", id),
};

const commentsProps: CommentSectionProps = {
  items: [
    {
      type: "comment",
      value: {
        id: "comment-1",
        content: JSON.stringify(asRichText("This looks great — thanks for writing it up.")),
        author: {
          id: commentAuthor.id,
          fullName: commentAuthor.fullName,
          avatarUrl: commentAuthor.avatarUrl ?? null,
          profileLink: "#",
        },
        insertedAt: "2026-05-14T10:00:00Z",
        reactions: [],
      },
    },
  ],
  currentUser: {
    id: author.id,
    fullName: author.fullName,
    avatarUrl: author.avatarUrl ?? null,
    profileLink: "#",
  },
  canComment: true,
  onAddComment: async () => true,
  onEditComment: async () => true,
  onDeleteComment: async () => undefined,
  richTextHandlers,
  formattedTimePreferences: defaultFormattedTimePreferences,
};

const basePublished = {
  pageTitle: "Interview Guide",
  navigation,
  testId: "resource-hub-document-page",
  title: "Interview Guide",
  author,
  state: "published" as const,
  publishedAt: "2026-05-13T12:00:00Z",
  modifiedAt: "2026-05-14T12:00:00Z",
  formattedTimePreferences: defaultFormattedTimePreferences,
  content: JSON.stringify(asRichText("How we interview candidates at Operately.")),
  mentionedPersonLookup: richTextHandlers.mentionedPersonLookup,
};

export const Default: Story = {
  args: {} as DocumentPage.Props,
  render: () => (
    <DocumentPage
      {...basePublished}
      hideDraftActions
      reactions={reactionsProps}
      comments={commentsProps}
      subscriptions={subscriptionsProps}
      copyModal={{
        isOpen: false,
        onClose: () => undefined,
        listContext: mockCopyListContext,
        document: mockDocument,
      }}
      deleteModal={{
        isOpen: false,
        onClose: () => undefined,
        documentName: "Interview Guide",
        onConfirm: async () => console.log("delete"),
      }}
    />
  ),
};

export const Draft: Story = {
  args: {} as DocumentPage.Props,
  render: () => (
    <DocumentPage
      {...basePublished}
      state="draft"
      publishedAt={undefined}
      draftActions={{
        state: "draft",
        updatedAt: "2026-05-14T12:00:00Z",
        editPath: "/documents/doc-1/edit",
        onPublish: () => console.log("publish"),
        formattedTimePreferences: defaultFormattedTimePreferences,
      }}
      reactions={reactionsProps}
      comments={commentsProps}
      subscriptions={subscriptionsProps}
      copyModal={{
        isOpen: false,
        onClose: () => undefined,
        listContext: mockCopyListContext,
        document: mockDocument,
      }}
      deleteModal={{
        isOpen: false,
        onClose: () => undefined,
        documentName: "Interview Guide",
        onConfirm: async () => console.log("delete"),
      }}
    />
  ),
};

export const TemplateReadOnly: Story = {
  args: {} as DocumentPage.Props,
  parameters: {
    reactRouter: {
      path: "/project-templates/template-1/documents/node-1",
      routePath: "/project-templates/:templateId/documents/:id",
    },
  },
  render: () => (
    <DocumentPage
      pageTitle={["Interview Guide", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
      ]}
      testId="project-template-document-page"
      title="Interview Guide"
      author={author}
      state="published"
      publishedAt="2026-05-13T12:00:00Z"
      modifiedAt="2026-05-13T12:00:00Z"
      formattedTimePreferences={defaultFormattedTimePreferences}
      content={JSON.stringify(asRichText("Template document content used when creating projects."))}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      hideDraftActions
      hideReactions
      hideComments
      hideSubscriptions
      hideCopyModal
      hideDeleteModal
    />
  ),
};
