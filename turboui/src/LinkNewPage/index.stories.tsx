import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { LinkNewPage } from "./index";
import type { LinkNewPage as LinkNewPageTypes } from "./types";
import { SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { genPeople } from "../utils/storybook/genPeople";

const meta = {
  title: "Pages/LinkNewPage",
  component: LinkNewPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/resource-hubs/hub-1/new-link",
      routePath: "/resource-hubs/:id/new-link",
    },
  },
} satisfies Meta<typeof LinkNewPage>;

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
  args: {} as LinkNewPageTypes.Props,
  render: () => {
    const subscriptions = useInteractiveSubscriptions();

    return (
      <LinkNewPage
        pageTitle="New Link"
        navigation={navigation}
        testId="resource-hub-new-link-page"
        richTextHandlers={createMockRichEditorHandlers()}
        initialType="other"
        cancelLink="/resource-hubs/hub-1"
        subscriptions={subscriptions}
        onSubmit={async (values) => {
          console.log("Submit", values);
          return true;
        }}
      />
    );
  },
};

export const GoogleDoc: Story = {
  args: {} as LinkNewPageTypes.Props,
  render: () => {
    const subscriptions = useInteractiveSubscriptions();

    return (
      <LinkNewPage
        pageTitle="New Link"
        navigation={navigation}
        testId="resource-hub-new-link-page"
        richTextHandlers={createMockRichEditorHandlers()}
        initialType="google_doc"
        cancelLink="/resource-hubs/hub-1"
        subscriptions={subscriptions}
        onSubmit={async (values) => {
          console.log("Submit", values);
          return true;
        }}
      />
    );
  },
};

export const Template: Story = {
  args: {} as LinkNewPageTypes.Props,
  parameters: {
    reactRouter: {
      path: "/project-templates/template-1/links/new",
      routePath: "/project-templates/:templateId/links/new",
    },
  },
  render: () => (
    <LinkNewPage
      pageTitle={["New Link", "Launch Playbook"]}
      navigation={[
        { to: "/spaces/space-1", label: "Product" },
        { to: "/spaces/space-1/project-templates", label: "Project Templates" },
        { to: "/project-templates/template-1", label: "Launch Playbook" },
        { to: "/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
      ]}
      testId="project-template-new-link-page"
      richTextHandlers={createMockRichEditorHandlers()}
      initialType="figma"
      cancelLink="/project-templates/template-1?tab=docs-and-files"
      hideSubscriptions
      onSubmit={async (values) => {
        console.log("Submit", values);
        return true;
      }}
    />
  ),
};
