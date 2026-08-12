import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { DocumentEditPage } from "./index";
import type { DocumentEditPage as DocumentEditPageTypes } from "./types";
import { SubscribersSelector } from "../Subscriptions";
import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { genPeople } from "../utils/storybook/genPeople";

const meta = {
  title: "Pages/DocumentEditPage",
  component: DocumentEditPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/documents/doc-1/edit",
      routePath: "/documents/:id/edit",
    },
  },
} satisfies Meta<typeof DocumentEditPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockPeople = genPeople(6);

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

const initialContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Review the launch checklist before go-live." }],
    },
  ],
};

function useInteractiveSubscriptions(): SubscribersSelector.Props {
  const [subscriptionType, setSubscriptionType] = useState<SubscribersSelector.SubscriptionOption>(
    SubscribersSelector.SubscriptionOption.ALL,
  );
  const [selectedSubscribers, setSelectedSubscribers] = useState<SubscribersSelector.Subscriber[]>([]);

  return {
    subscribers: mockSubscribers,
    selectedSubscribers,
    onSelectedSubscribersChange: setSelectedSubscribers,
    subscriptionType,
    onSubscriptionTypeChange: setSubscriptionType,
    alwaysNotify: [],
    allSubscribersLabel: "Everyone who has access to Documents & Files",
  };
}

export const Default: Story = {
  args: {} as DocumentEditPageTypes.Props,
  render: () => {
    const subscriptions = useInteractiveSubscriptions();

    return (
      <DocumentEditPage
        pageTitle="Edit Document"
        navigation={navigation}
        testId="resource-hub-edit-document-page"
        richTextHandlers={createMockRichEditorHandlers()}
        initialTitle="Launch Checklist"
        initialContent={initialContent}
        cancelLink="/documents/doc-1"
        subscriptions={subscriptions}
        onSubmit={async (values, meta) => {
          console.log("Submit", values, meta);
          return true;
        }}
      />
    );
  },
};

export const Published: Story = {
  args: {} as DocumentEditPageTypes.Props,
  render: () => (
    <DocumentEditPage
      pageTitle="Edit Document"
      navigation={navigation}
      testId="resource-hub-edit-document-page"
      richTextHandlers={createMockRichEditorHandlers()}
      initialTitle="Launch Checklist"
      initialContent={initialContent}
      cancelLink="/documents/doc-1"
      hideSubscriptions
      hidePublishAction
      onSubmit={async (values, meta) => {
        console.log("Submit", values, meta);
        return true;
      }}
    />
  ),
};

export const Template: Story = {
  args: {} as DocumentEditPageTypes.Props,
  parameters: {
    reactRouter: {
      path: "/project-templates/template-1/documents/node-1/edit",
      routePath: "/project-templates/:templateId/documents/:id/edit",
    },
  },
  render: () => (
    <DocumentEditPage
      pageTitle={["Edit Document", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
        { to: "/project-templates/template-1/documents/node-1", label: "Launch Checklist" },
      ]}
      testId="project-template-edit-document-page"
      richTextHandlers={createMockRichEditorHandlers()}
      initialTitle="Launch Checklist"
      initialContent={emptyContent()}
      cancelLink="/project-templates/template-1/documents/node-1"
      hideSubscriptions
      hidePublishAction
      onSubmit={async (values, meta) => {
        console.log("Submit", values, meta);
        return true;
      }}
    />
  ),
};
