import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { NewDocumentPage } from "./index";
import { SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { genPeople } from "../utils/storybook/genPeople";

const meta = {
  title: "Pages/NewDocumentPage",
  component: NewDocumentPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/resource-hubs/hub-1/new-document",
      routePath: "/resource-hubs/:id/new-document",
    },
  },
} satisfies Meta<typeof NewDocumentPage>;

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
];

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
  args: {} as NewDocumentPage.Props,
  render: () => {
    const subscriptions = useInteractiveSubscriptions();

    return (
      <NewDocumentPage
        pageTitle="New Document"
        navigation={navigation}
        testId="resource-hub-new-document-page"
        richTextHandlers={createMockRichEditorHandlers()}
        cancelLink="/resource-hubs/hub-1"
        subscriptions={subscriptions}
        onSubmit={async (values, meta) => {
          console.log("Submit", values, meta);
          return true;
        }}
      />
    );
  },
};

export const WithoutSubscriptionsOrDraft: Story = {
  args: {} as NewDocumentPage.Props,
  parameters: {
    reactRouter: {
      path: "/project-templates/template-1/docs-and-files/new",
      routePath: "/project-templates/:templateId/docs-and-files/new",
    },
  },
  render: () => (
    <NewDocumentPage
      pageTitle={["New Document", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
      ]}
      testId="project-template-new-document-page"
      richTextHandlers={createMockRichEditorHandlers()}
      cancelLink="/project-templates/template-1?tab=docs-and-files"
      hideSubscriptions
      hideDraftActions
      onSubmit={async (values, meta) => {
        console.log("Submit", values, meta);
        return true;
      }}
    />
  ),
};
