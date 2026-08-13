import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { FilePage } from "./index";
import type { FilePage as FilePageTypes } from "./types";
import type { CommentSectionProps } from "../CommentSection";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { IconDownload, IconEdit, IconTrash } from "../icons";
import { CurrentSubscriptions, SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { genPeople } from "../utils/storybook/genPeople";

const meta = {
  title: "Pages/FilePage",
  component: FilePage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/files/file-1",
      routePath: "/files/:id",
    },
  },
} satisfies Meta<typeof FilePage>;

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

const subscriptionsProps: CurrentSubscriptions.Props = {
  subscribers: mockSubscribers,
  subscribedPeople: mockSubscribers,
  isCurrentUserSubscribed: true,
  resourceName: "file",
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
        content: JSON.stringify(asRichText("Looks great — thanks!")),
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

const imageBlob = {
  url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200",
  contentType: "image/jpeg",
  width: 1200,
  height: 800,
};

const baseProps = {
  pageTitle: "Launch photo",
  navigation,
  testId: "resource-hub-file-page",
  title: "Launch photo",
  author,
  postedAt: "2026-05-13T12:00:00Z",
  formattedTimePreferences: defaultFormattedTimePreferences,
  filename: "launch-photo.jpg",
  fileSize: "1MB",
  viewUrl: imageBlob.url,
  onDownload: () => console.log("download"),
  blob: imageBlob,
  description: JSON.stringify(asRichText("Hero image for the launch campaign.")),
  mentionedPersonLookup: richTextHandlers.mentionedPersonLookup,
};

export const Default: Story = {
  args: {} as FilePageTypes.Props,
  render: () => (
    <FilePage
      {...baseProps}
      options={[
        {
          type: "action",
          icon: IconDownload,
          label: "Download",
          onClick: () => console.log("download"),
          testId: "download-file-link",
        },
        {
          type: "link",
          icon: IconEdit,
          label: "Edit",
          link: "/files/file-1/edit",
          keepOutsideOnBigScreen: true,
          testId: "edit-file-link",
        },
        {
          type: "action",
          icon: IconTrash,
          label: "Delete",
          onClick: () => console.log("delete"),
          testId: "delete-resource-link",
        },
      ]}
      reactions={reactionsProps}
      comments={commentsProps}
      subscriptions={subscriptionsProps}
      deleteModal={{
        isOpen: false,
        onClose: () => undefined,
        fileName: "Launch photo",
        onConfirm: async () => undefined,
      }}
    />
  ),
};

export const Template: Story = {
  args: {} as FilePageTypes.Props,
  parameters: {
    reactRouter: {
      path: "/project-templates/template-1/files/node-1",
      routePath: "/project-templates/:templateId/files/:id",
    },
  },
  render: () => (
    <FilePage
      pageTitle={["Launch photo", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
      ]}
      options={[
        {
          type: "action",
          icon: IconDownload,
          label: "Download",
          onClick: () => console.log("download"),
          testId: "download-file-link",
        },
      ]}
      testId="project-template-file-page"
      title="Launch photo"
      author={author}
      postedAt="2026-05-13T12:00:00Z"
      formattedTimePreferences={defaultFormattedTimePreferences}
      filename="launch-photo.jpg"
      fileSize="1MB"
      viewUrl={imageBlob.url}
      onDownload={() => console.log("download")}
      blob={imageBlob}
      description={JSON.stringify(asRichText("Template file notes."))}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      hideReactions
      hideComments
      hideSubscriptions
      hideDeleteModal
    />
  ),
};
