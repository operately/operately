import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { ProjectCheckInFormPage } from "./index";
import { SubscribersSelector } from "../Subscriptions";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { genPeople } from "../utils/storybook/genPeople";
import { createMockCheckIn, mockReviewer, navigation } from "./mockData";

const meta = {
  title: "Pages/ProjectCheckInFormPage",
  component: ProjectCheckInFormPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/projects/project-1/check-ins/new",
      routePath: "/projects/:projectId/check-ins/new",
    },
  },
} satisfies Meta<typeof ProjectCheckInFormPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockPeople = genPeople(4);
const richTextHandlers = createMockRichEditorHandlers();

const mockSubscribers: SubscribersSelector.Subscriber[] = mockPeople.map((person) => ({
  person,
  isSubscribed: false,
  priority: false,
  role: null,
}));

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
    allSubscribersLabel: "Everyone who is contributing to Apollo",
  };
}

export const Create: Story = {
  args: {} as ProjectCheckInFormPage.Props,
  render: () => {
    const subscriptions = useInteractiveSubscriptions();

    return (
      <ProjectCheckInFormPage
        mode="create"
        pageTitle={["Check-In", "Apollo"]}
        navigation={navigation}
        cancelLink="/projects/project-1?tab=check-ins"
        richTextHandlers={richTextHandlers}
        mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
        formattedTimePreferences={defaultFormattedTimePreferences}
        reviewer={mockReviewer}
        previousCheckIn={{
          checkIn: createMockCheckIn(),
          link: "/projects/project-1/check-ins/check-in-1",
        }}
        subscriptions={subscriptions}
        onSubmit={async (values, meta) => {
          console.log("Create submit", values, meta);
          return true;
        }}
      />
    );
  },
};

export const EditFull: Story = {
  args: {} as ProjectCheckInFormPage.Props,
  parameters: {
    reactRouter: {
      path: "/projects/project-1/check-ins/check-in-1/edit",
      routePath: "/projects/:projectId/check-ins/:id/edit",
    },
  },
  render: () => (
    <ProjectCheckInFormPage
      mode="edit"
      pageTitle={["Edit Project Check-In", "Apollo"]}
      navigation={navigation}
      cancelLink="/projects/project-1/check-ins/check-in-1"
      richTextHandlers={richTextHandlers}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      formattedTimePreferences={defaultFormattedTimePreferences}
      reviewer={mockReviewer}
      checkIn={createMockCheckIn({
        state: "published",
        publishedAt: new Date().toISOString(),
        insertedAt: new Date().toISOString(),
      })}
      allowFullEdit
      onSubmit={async (values, meta) => {
        console.log("Edit submit", values, meta);
        return true;
      }}
    />
  ),
};

export const EditLockedStatus: Story = {
  args: {} as ProjectCheckInFormPage.Props,
  parameters: {
    reactRouter: {
      path: "/projects/project-1/check-ins/check-in-1/edit",
      routePath: "/projects/:projectId/check-ins/:id/edit",
    },
  },
  render: () => (
    <ProjectCheckInFormPage
      mode="edit"
      pageTitle={["Edit Project Check-In", "Apollo"]}
      navigation={navigation}
      cancelLink="/projects/project-1/check-ins/check-in-1"
      richTextHandlers={richTextHandlers}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      formattedTimePreferences={defaultFormattedTimePreferences}
      reviewer={mockReviewer}
      checkIn={createMockCheckIn({
        state: "published",
        status: "caution",
        publishedAt: "2024-01-01T12:00:00.000Z",
        insertedAt: "2024-01-01T12:00:00.000Z",
      })}
      allowFullEdit={false}
      onSubmit={async (values, meta) => {
        console.log("Edit locked submit", values, meta);
        return true;
      }}
    />
  ),
};

export const EditScheduledDraft: Story = {
  args: {} as ProjectCheckInFormPage.Props,
  parameters: {
    reactRouter: {
      path: "/projects/project-1/check-ins/check-in-1/edit",
      routePath: "/projects/:projectId/check-ins/:id/edit",
    },
  },
  render: () => (
    <ProjectCheckInFormPage
      mode="edit"
      pageTitle={["Edit Project Check-In", "Apollo"]}
      navigation={navigation}
      cancelLink="/projects/project-1/check-ins/check-in-1"
      richTextHandlers={richTextHandlers}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      formattedTimePreferences={defaultFormattedTimePreferences}
      reviewer={mockReviewer}
      checkIn={createMockCheckIn({
        state: "scheduled",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        publishedAt: null,
      })}
      allowFullEdit
      onSubmit={async (values, meta) => {
        console.log("Edit scheduled submit", values, meta);
        return true;
      }}
    />
  ),
};
