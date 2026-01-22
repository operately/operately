import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { ProfilePage } from "./index";

import { PersonCard } from "../PersonCard";
import { WorkMap } from "../WorkMap";
import { genPeople } from "../utils/storybook/genPeople";
import { mockItems, mockTasksTabItems } from "../WorkMap/tests/mockData";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";

const meta = {
  title: "Pages/ProfilePage",
  component: ProfilePage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/profile?tab=tasks",
      routePath: "/profile",
    },
  },
} satisfies Meta<typeof ProfilePage>;

export default meta;
type Story = StoryObj<typeof meta>;

function toProfilePerson(person: { id: string; fullName: string; title: string; avatarUrl: string | null; profileLink: string }): PersonCard.Person {
  const email = `${person.id}@example.com`;

  return {
    id: person.id,
    fullName: person.fullName,
    email,
    avatarUrl: person.avatarUrl,
    title: person.title,
    profileLink: person.profileLink,
  };
}

const [person, manager, peer1, peer2, report1, report2, viewer] = genPeople(7).map(toProfilePerson);

const defaultWorkMap: WorkMap.Item[] = [...mockItems, ...mockTasksTabItems];
const defaultReviewerWorkMap: WorkMap.Item[] = mockItems.slice(0, 2);

const defaultArgs: ProfilePage.Props = {
  title: "Profile",

  person: person!,
  manager: manager!,
  peers: [peer1!, peer2!],
  reports: [report1!, report2!],

  workMap: defaultWorkMap,
  reviewerWorkMap: defaultReviewerWorkMap,

  activityFeed: (
    <div className="bg-surface-base border border-surface-outline rounded-lg p-4">
      Activity feed placeholder
    </div>
  ),

  editProfilePath: "#",
  canEditProfile: true,

  viewer: viewer!,

  aboutMe: asRichText("Coffee nerd, jazz fan, and always happy to share shortcuts."),
  mentionedPersonLookup: createMockRichEditorHandlers().mentionedPersonLookup,
};

export const Default: Story = {
  args: defaultArgs,
};

export const EmptyTasks: Story = {
  args: {
    ...defaultArgs,
    workMap: mockItems,
  },
};
