import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { LinkPage } from "./index";
import type { LinkPage as LinkPageTypes } from "./types";
import type { CommentSectionProps } from "../CommentSection";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { IconEdit } from "../icons";
import { CurrentSubscriptions, SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { genPeople } from "../utils/storybook/genPeople";

const meta = {
  title: "Pages/LinkPage",
  component: LinkPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/links/link-1",
      routePath: "/links/:id",
    },
  },
} satisfies Meta<typeof LinkPage>;

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
  resourceName: "link",
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
        content: JSON.stringify(asRichText("Useful reference — thanks!")),
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

const baseProps = {
  pageTitle: "Design Spec",
  navigation,
  testId: "resource-hub-link-page",
  linkType: "figma" as const,
  title: "Design Spec",
  url: "https://www.figma.com/file/example",
  author,
  postedAt: "2026-05-13T12:00:00Z",
  formattedTimePreferences: defaultFormattedTimePreferences,
  description: JSON.stringify(asRichText("Shared design reference for the launch.")),
  mentionedPersonLookup: richTextHandlers.mentionedPersonLookup,
};

export const Default: Story = {
  args: {} as LinkPageTypes.Props,
  render: () => (
    <LinkPage
      {...baseProps}
      options={[
        {
          type: "link",
          icon: IconEdit,
          label: "Edit",
          link: "/links/link-1/edit",
          keepOutsideOnBigScreen: true,
          testId: "edit-link-link",
        },
      ]}
      reactions={reactionsProps}
      comments={commentsProps}
      subscriptions={subscriptionsProps}
      deleteModal={{
        isOpen: false,
        onClose: () => undefined,
        linkName: "Design Spec",
        onConfirm: async () => undefined,
      }}
    />
  ),
};

export const Template: Story = {
  args: {} as LinkPageTypes.Props,
  parameters: {
    reactRouter: {
      path: "/project-templates/template-1/links/node-1",
      routePath: "/project-templates/:templateId/links/:id",
    },
  },
  render: () => (
    <LinkPage
      pageTitle={["Design Spec", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
      ]}
      options={[
        {
          type: "link",
          icon: IconEdit,
          label: "Edit",
          link: "/project-templates/template-1/links/node-1/edit",
          keepOutsideOnBigScreen: true,
          testId: "edit-link-link",
        },
      ]}
      testId="project-template-link-page"
      linkType="figma"
      title="Design Spec"
      url="https://www.figma.com/file/example"
      author={author}
      postedAt="2026-05-13T12:00:00Z"
      formattedTimePreferences={defaultFormattedTimePreferences}
      description={JSON.stringify(asRichText("Template link notes."))}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      hideReactions
      hideComments
      hideSubscriptions
      hideDeleteModal
    />
  ),
};
