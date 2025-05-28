import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { GoalPage } from ".";
import { MiniWorkMap } from "../MiniWorkMap";
import { genPeople } from "../utils/storybook/genPeople";
import { storyPath } from "../utils/storybook/storypath";
import { currentQuarter, lastYear } from "../utils/timeframes";

const meta: Meta<typeof GoalPage> = {
  title: "Pages/GoalPage",
  component: GoalPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GoalPage>;

const people = genPeople(2);
const champion = people[0]!;
const reviewer = people[1]!;

const mockTargets = [
  {
    id: "1",
    index: 0,
    name: "Increase Monthly Active Users",
    from: 10000,
    to: 50000,
    value: 25000,
    unit: "users",
    mode: "view" as const,
  },
  {
    id: "2",
    index: 1,
    name: "Improve Response Time",
    from: 500,
    to: 100,
    value: 250,
    unit: "ms",
    mode: "view" as const,
  },
  {
    id: "3",
    index: 2,
    name: "Achieve System Uptime",
    from: 99.5,
    to: 99.99,
    value: 99.8,
    unit: "%",
    mode: "view" as const,
  },
];

const checkIns = [
  {
    link: "/checkins/1",
    id: "1",
    author: champion,
    date: new Date(2025, 3, 17), // Apr 17th, 2025
    content: asRichText(
      "Kickoff meeting held. Team is excited and we have outlined the initial roadmap. Next steps: finalize requirements and assign tasks.",
    ),
    commentCount: 48,
    status: "on_track",
  },
  {
    link: "/checkins/1",
    id: "2",
    author: reviewer,
    date: new Date(2025, 3, 24), // Apr 24th, 2025
    content: asRichText(
      "Reviewed the first sprint deliverables. Progress is on track, but we need to improve test coverage and documentation.",
    ),
    commentCount: 2,
    status: "on_track",
  },
  {
    link: "/checkins/1",
    id: "3",
    author: champion,
    date: new Date(2025, 3, 30), // Apr 30th, 2025
    content: asRichText(
      "Completed integration with the new data pipeline. Encountered some issues with API rate limits, but workaround is in place.",
    ),
    commentCount: 0,
    status: "on_track",
  },
];

const messages = [
  {
    id: "1",
    title: "Kick-Off",
    author: champion,
    content: "We have officially started the project! The team is aligned and ready to move forward.",
    link: "/messages/1",
  },
  {
    id: "2",
    title: "Execution plan for the German team",
    author: reviewer,
    content: "Outlined the execution plan for the German team. Please review and provide feedback by Friday.",
    link: "/messages/2",
  },
  {
    id: "3",
    title: "Preview of what is coming next week",
    author: champion,
    content: "Next week we will focus on integrating the authentication module and preparing the first demo.",
    link: "/messages/3",
  },
  {
    id: "4",
    title: "Sprint 1 Retrospective",
    author: reviewer,
    content: "Sprint 1 went well overall, but we identified some bottlenecks in the review process.",
    link: "/messages/4",
  },
  {
    id: "5",
    title: "Security Review Notes",
    author: champion,
    content: "Security review completed. No major issues found, but a few recommendations were made.",
    link: "/messages/5",
  },
  {
    id: "6",
    title: "Customer Feedback Roundup",
    author: reviewer,
    content: "Collected initial feedback from customers. Most are excited about the new features!",
    link: "/messages/6",
  },
];

const relatedWorkItems: MiniWorkMap.WorkItem[] = [
  {
    id: "1",
    type: "goal" as const,
    status: "on_track",
    name: "Backend Infrastructure",
    itemPath: "/goals/1",
    progress: 75,
    state: "active",
    children: [
      {
        id: "3",
        type: "project" as const,
        status: "caution",
        name: "API Development",
        itemPath: "/projects/3",
        progress: 60,
        state: "active",
        children: [],
        assignees: genPeople(10, { random: true }),
      },
      {
        id: "4",
        type: "goal" as const,
        status: "on_track",
        name: "Database Optimization",
        itemPath: "/goals/4",
        progress: 90,
        state: "active",
        children: [
          {
            id: "5",
            type: "project" as const,
            status: "on_track",
            name: "Query Performance",
            itemPath: "/projects/5",
            progress: 100,
            state: "closed",
            children: [],
            assignees: genPeople(2, { random: true }),
          },
        ],
        assignees: genPeople(2, { random: true }),
      },
    ],
    assignees: genPeople(3, { random: true }),
  },
  {
    id: "2",
    type: "goal" as const,
    status: "on_track",
    name: "UI/UX Design",
    itemPath: "/goals/2",
    progress: 100,
    state: "closed",
    assignees: genPeople(7, { random: true }),
    children: [
      {
        id: "6",
        type: "project",
        status: "on_track",
        name: "Design System",
        itemPath: "/projects/6",
        progress: 100,
        state: "closed",
        children: [],
        assignees: genPeople(3, { random: true }),
      },
    ],
  },
];

const contributions = [
  [
    { role: "Marketing Lead", link: "/goals/1", location: "Website Redesign" },
    { role: "Reviewer", link: "/projects/3", location: "Backend Infrastructure" },
    { role: "Reviewer", link: "/projects/5", location: "API Development" },
    { role: "Software Engineer", link: "/projects/6", location: "Database Optimization" },
    { role: "Designer", link: "/projects/2", location: "UI/UX Design" },
    { role: "Project Manager", link: "/projects/4", location: "Design System" },
  ],
  [
    { role: "Champion", link: "/goals/1", location: "Backend Infrastructure" },
    { role: "Software Engineer", link: "/projects/3", location: "API Development" },
    { role: "Reviewer", link: "/goals/4", location: "Database Optimization" },
  ],
  [
    { role: "Designer", link: "/goals/2", location: "UI/UX Design" },
    { role: "Project Manager", link: "/projects/6", location: "Design System" },
  ],
  [{ role: "Software Engineer", link: "/goals/1", location: "Backend Infrastructure" }],
];

const contributors: GoalPage.Contributor[] = genPeople(10).map((p, i) => {
  const person = p!;

  const personContributions =
    i < contributions.length
      ? contributions[i]
      : contributions.length > 0
      ? contributions[contributions.length - 1]
      : [];

  return {
    person,
    personLink: `/people/${person.id}`,
    contributions: personContributions || [],
  };
});

contributors.sort((a, b) => (b.contributions?.length || 0) - (a.contributions?.length || 0));

const description: any = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Our mission is to develop and launch a cutting-edge AI platform that will revolutionize how businesses interact with artificial intelligence. This platform will integrate advanced machine learning capabilities, natural language processing, and automated decision-making systems to provide comprehensive AI solutions.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Key features include real-time data processing, scalable infrastructure, and user-friendly interfaces for both technical and non-technical users. The platform will support multiple AI models, custom training pipelines, and enterprise-grade security measures.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "We aim to make AI technology more accessible and practical for businesses of all sizes, while maintaining high standards of performance and reliability. This initiative aligns with our company's strategic goal of becoming a leader in the AI solutions market and will serve as a foundation for future AI-driven products and services.",
        },
      ],
    },
  ],
};

const parentGoal = {
  name: "Accelerate product growth",
  link: "/goals/1",
};

const searchFn = async ({ query }: { query: string }) => {
  if (!query) return people;
  return people.filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase()));
};

const defaultArgs: GoalPage.Props = {
  spaceLink: "/spaces/1",
  workmapLink: "/spaces/1/workmaps/1",
  closeLink: storyPath("Pages/GoalClosePage", "Default"),
  deleteLink: storyPath("Pages/GoalDeletePage", "Default"),
  editGoalLink: storyPath("Pages/GoalEditPage", "Default"),
  newCheckInLink: storyPath("Pages/GoalCheckInPage", "Default"),
  addSubgoalLink: "#",
  addSubprojectLink: "#",

  goalName: "Launch AI Platform",
  spaceName: "Product",
  champion: champion,
  reviewer: reviewer,
  targets: mockTargets,
  relatedWorkItems: relatedWorkItems,
  timeframe: currentQuarter(),
  contributors: contributors,
  canEdit: true,
  description,
  checkIns,
  messages,
  parentGoal,
  status: "on_track",
  privacyLevel: "internal" as const,
  mentionedPersonLookup: async (_id: string) => null,
  peopleSearch: searchFn,
  activityFeed: <div></div>,

  updateGoalName: async (_name: string) => true,
  updateDueDate: async (_date: Date | null) => true,
  updateDescription: async (_description: string | null) => true,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: defaultArgs,
};

export const DefaultReadOnly: Story = {
  args: {
    ...defaultArgs,
    canEdit: false,
  },
};

export const ZeroStateForChampions: Story = {
  args: {
    ...defaultArgs,
    targets: [],
    checkIns: [],
    messages: [],
    contributors: [],
    relatedWorkItems: [],
    canEdit: true,
    description: null,
    reviewer: null,
    status: "pending",
    timeframe: {
      startDate: new Date(2025, 3, 1), // Apr 1st, 2025
      endDate: null,
    },
  },
};

export const ZeroStateReadOnly: Story = {
  args: {
    ...defaultArgs,
    targets: [],
    checkIns: [],
    messages: [],
    contributors: [],
    relatedWorkItems: [],
    canEdit: false,
    description: null,
    reviewer: null,
    status: "pending",
    timeframe: {
      startDate: new Date(2025, 3, 1), // Apr 1st, 2025
      endDate: null,
    },
  },
};

export const Mobile: Story = {
  args: defaultArgs,
  parameters: {
    viewport: {
      defaultViewport: "mobile2",
    },
  },
};

export const CompanyWideGoal: Story = {
  args: {
    ...defaultArgs,
    parentGoal: null,
  },
};

export const LongName: Story = {
  args: {
    ...defaultArgs,
    goalName: "Enchance the AI Platform with Advanced Features and Integrations",
  },
};

export const LongParentName: Story = {
  args: {
    ...defaultArgs,
    parentGoal: {
      id: "1",
      name: "Enchance the AI Platform with Advanced Features and Integrations",
    },
  },
};

export const ClosedGoal: Story = {
  args: {
    ...defaultArgs,
    status: "achieved",
    closedOn: new Date(2025, 3, 30), // Apr 30th, 2025
    retrospectiveLink: "/retrospective/1",
    timeframe: lastYear(),
  },
};

export const PrivateGoal: Story = {
  args: {
    ...defaultArgs,
    privacyLevel: "confidential",
  },
};

export const NeglectedGoal: Story = {
  args: {
    ...defaultArgs,
    neglectedGoal: true,
  },
};

export const NeglectedGoalReadOnly: Story = {
  args: {
    ...defaultArgs,
    neglectedGoal: true,
    canEdit: false,
  },
};

export const OverdueGoal: Story = {
  args: {
    ...defaultArgs,
    timeframe: lastYear(),
  },
};

function asRichText(content: string): any {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: content,
          },
        ],
      },
    ],
  };
}
