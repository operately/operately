import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { GoalPage } from ".";
import { DateField } from "../DateField";
import { MiniWorkMap } from "../MiniWorkMap";
import { PrivacyField } from "../PrivacyField";
import { genPeople, genPerson, searchPeopleFn } from "../utils/storybook/genPeople";
import { parentGoalSearchFn } from "../utils/storybook/parentGoalSearchFn";
import { spaceSearchFn } from "../utils/storybook/spaceSearchFn";
import { storyPath } from "../utils/storybook/storypath";
import { startOfCurrentYear } from "../utils/time";

const meta: Meta<typeof GoalPage> = {
  title: "Pages/GoalPage",
  component: GoalPage,
  parameters: {
    layout: "fullscreen",
  },
  render: (args) => <Component {...args} />,
} satisfies Meta<typeof GoalPage>;

const addTarget = (): Promise<{ id: string; success: boolean }> =>
  new Promise((resolve) => resolve({ success: true, id: crypto.randomUUID() as string }));

const deleteTarget = (): Promise<boolean> => new Promise((resolve) => resolve(true));
const deleteGoal = (): Promise<void> => new Promise((resolve) => resolve());

const defaultParentGoal: GoalPage.ParentGoal = {
  id: "1",
  name: "Accelerate product growth",
  link: "/goals/1",
};

const defaultSpace: GoalPage.Space = {
  id: "1",
  name: "Product Development",
  link: "/spaces/1",
};

function Component(props: Partial<GoalPage.Props>) {
  const [goalName, setGoalName] = React.useState<string>(props.goalName || "Launch AI Platform");
  const [space, setSpace] = React.useState<GoalPage.Space>(props.space || defaultSpace);
  const [dueDate, setDueDate] = React.useState<DateField.ContextualDate | null>(props.dueDate || null);
  const [startDate, setStartDate] = React.useState<DateField.ContextualDate | null>(props.startDate || null);
  const [champion, setChampion] = React.useState<GoalPage.Person | null>(props.champion || null);
  const [reviewer, setReviewer] = React.useState<GoalPage.Person | null>(props.reviewer || null);
  const [parentGoal, setParentGoal] = React.useState<GoalPage.ParentGoal | null>(props.parentGoal || defaultParentGoal);
  const [checklistItems, setChecklistItems] = React.useState(props.checklistItems || []);
  const [accessLevels, setAccessLevels] = React.useState<PrivacyField.AccessLevels>(
    props.accessLevels || {
      company: "view",
      space: "view",
    },
  );

  React.useEffect(() => {
    setChecklistItems(props.checklistItems || []);
  }, [props.checklistItems]);

  const checklistHandlers = {
    addChecklistItem: async (inputs: { name: string }) => {
      const newItem = {
        id: Date.now().toString(),
        name: inputs.name,
        completed: false,
        index: checklistItems.length,
        mode: "view" as const,
      };
      setChecklistItems((prev) => [...prev, newItem]);
      return { success: true, id: newItem.id };
    },
    deleteChecklistItem: async (id: string) => {
      setChecklistItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    },
    updateChecklistItem: async (inputs: { itemId: string; name: string }) => {
      setChecklistItems((prev) =>
        prev.map((item) => (item.id === inputs.itemId ? { ...item, name: inputs.name } : item)),
      );
      return true;
    },
    toggleChecklistItem: async (id: string, completed: boolean) => {
      setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, completed } : item)));
      return true;
    },
    updateChecklistItemIndex: async (id: string, index: number) => {
      setChecklistItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === id);
        if (oldIndex === -1) return prev;

        const newItems = [...prev];
        const [removed] = newItems.splice(oldIndex, 1);
        if (removed) {
          newItems.splice(index, 0, removed);
        }

        return newItems.map((item, idx) => ({ ...item, index: idx }));
      });
      return true;
    },
  };

  const defaults = {
    description,
    status: "on_track" as const,
    state: "active" as const,
    spaceName: "Product",
    targets: [],
    relatedWorkItems: [],
    checkIns: [],
    discussions: [],
    contributors: [],
    closedAt: null,
    neglectedGoal: false,
    retrospective: null,
  };

  return (
    <GoalPage
      {...defaults}
      {...props}
      ai={{
        enabled: true,
      }}
      checklistItems={checklistItems}
      goalName={goalName}
      setGoalName={setGoalName}
      space={space}
      setSpace={setSpace}
      spaceSearch={spaceSearchFn}
      accessLevels={accessLevels}
      setAccessLevels={setAccessLevels}
      workmapLink="#"
      closeLink="#"
      reopenLink="#"
      newCheckInLink={storyPath("Pages/GoalCheckInPage", "Default")}
      newDiscussionLink="#"
      addSubgoalLink="#"
      addSubprojectLink="#"
      parentGoal={parentGoal}
      setParentGoal={setParentGoal}
      parentGoalSearch={parentGoalSearchFn}
      champion={champion}
      setChampion={setChampion}
      reviewer={reviewer}
      setReviewer={setReviewer}
      dueDate={dueDate}
      setDueDate={setDueDate}
      startDate={startDate}
      setStartDate={setStartDate}
      canEdit={props.canEdit ?? true}
      mentionedPersonLookup={async (_id: string) => null}
      peopleSearch={searchPeopleFn}
      championSearch={searchPeopleFn}
      reviewerSearch={searchPeopleFn}
      activityFeed={<div></div>}
      updateDescription={async (_description: string | null) => true}
      addTarget={addTarget}
      deleteTarget={deleteTarget}
      updateTarget={async (_inputs) => true}
      updateTargetValue={async (_id, _value) => true}
      updateTargetIndex={async (_id, _index) => true}
      {...checklistHandlers}
      deleteGoal={deleteGoal}
    />
  );
}

export default meta;
type Story = StoryObj<typeof meta>;

// Mock Data

const mockCheckIns = [
  {
    link: "/checkins/1",
    id: "1",
    author: genPerson(),
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
    author: genPerson(),
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
    author: genPerson(),
    date: new Date(2025, 3, 30), // Apr 30th, 2025
    content: asRichText(
      "Completed integration with the new data pipeline. Encountered some issues with API rate limits, but workaround is in place.",
    ),
    commentCount: 0,
    status: "on_track",
  },
];

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

const mockChecklistItems = [
  {
    id: "1",
    name: "Complete user research interviews",
    completed: true,
    index: 0,
    mode: "view" as const,
  },
  {
    id: "2",
    name: "Design and validate wireframes",
    completed: true,
    index: 1,
    mode: "view" as const,
  },
  {
    id: "3",
    name: "Set up development environment",
    completed: false,
    index: 2,
    mode: "view" as const,
  },
  {
    id: "4",
    name: "Implement core AI features",
    completed: false,
    index: 3,
    mode: "view" as const,
  },
  {
    id: "5",
    name: "Conduct security review",
    completed: false,
    index: 4,
    mode: "view" as const,
  },
];

const mockDiscussions = [
  {
    id: "1",
    date: new Date(2025, 3, 15), // Apr 15th, 2025
    title: "Kick-Off",
    author: genPerson(),
    content: asRichText("We have officially started the project! The team is aligned and ready to move forward."),
    link: "/discussions/1",
    commentCount: 5,
  },
  {
    id: "2",
    date: new Date(2025, 3, 15), // Apr 15th, 2025
    title: "Execution plan for the German team",
    author: genPerson(),
    content: asRichText(
      "Outlined the execution plan for the German team. Please review and provide feedback by Friday.",
    ),
    link: "/discussions/2",
    commentCount: 0,
  },
  {
    id: "3",
    date: new Date(2025, 3, 15), // Apr 15th, 2025
    title: "Preview of what is coming next week",
    author: genPerson(),
    content: asRichText(
      "Next week we will focus on integrating the authentication module and preparing the first demo.",
    ),
    link: "/discussions/3",
    commentCount: 7,
  },
  {
    id: "4",
    date: new Date(2025, 3, 15), // Apr 15th, 2025
    title: "Sprint 1 Retrospective",
    author: genPerson(),
    content: asRichText("Sprint 1 went well overall, but we identified some bottlenecks in the review process."),
    link: "/discussions/4",
    commentCount: 1,
  },
  {
    id: "5",
    date: new Date(2025, 3, 15), // Apr 15th, 2025
    title: "Security Review Notes",
    author: genPerson(),
    content: asRichText("Security review completed. No major issues found, but a few recommendations were made."),
    link: "/discussions/5",
    commentCount: 1,
  },
  {
    id: "6",
    date: new Date(2025, 3, 15), // Apr 15th, 2025
    title: "Customer Feedback Roundup",
    author: genPerson(),
    content: asRichText("Collected initial feedback from customers. Most are excited about the new features!"),
    link: "/discussions/6",
    commentCount: 1,
  },
];

const mockRelatedWorkItems: MiniWorkMap.WorkItem[] = [
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

export const Default: Story = {
  args: {
    description: description,
    champion: genPerson(),
    reviewer: genPerson(),
    checkIns: mockCheckIns,
    targets: mockTargets,
    checklistItems: mockChecklistItems,
    discussions: mockDiscussions,
    contributors: contributors,
    relatedWorkItems: mockRelatedWorkItems,
    canEdit: true,
  },
};

export const DefaultReadOnly: Story = {
  args: {
    description: description,
    champion: genPerson(),
    reviewer: genPerson(),
    checkIns: mockCheckIns,
    targets: mockTargets,
    checklistItems: mockChecklistItems,
    discussions: mockDiscussions,
    contributors: contributors,
    relatedWorkItems: mockRelatedWorkItems,
    canEdit: false,
  },
};

export const OnlyTargets: Story = {
  args: {
    description: description,
    champion: genPerson(),
    reviewer: genPerson(),
    checkIns: mockCheckIns,
    targets: mockTargets,
    checklistItems: [], // Empty checklist items array
    discussions: mockDiscussions,
    contributors: contributors,
    relatedWorkItems: mockRelatedWorkItems,
    canEdit: true,
  },
};

export const OnlyChecklists: Story = {
  args: {
    description: description,
    champion: genPerson(),
    reviewer: genPerson(),
    checkIns: mockCheckIns,
    targets: [], // Empty targets array
    checklistItems: mockChecklistItems,
    discussions: mockDiscussions,
    contributors: contributors,
    relatedWorkItems: mockRelatedWorkItems,
    canEdit: true,
  },
};

export const ZeroStateForChampions: Story = {
  args: {
    canEdit: true,
    description: null,
    reviewer: null,
    status: "pending",
    dueDate: null,
  },
};

export const ZeroStateReadOnly: Story = {
  args: {
    targets: [],
    discussions: [],
    contributors: [],
    relatedWorkItems: [],
    canEdit: false,
    description: null,
    reviewer: null,
    status: "pending",
    dueDate: null,
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile2",
    },
  },
};

export const CompanyWideGoal: Story = {
  args: {
    parentGoal: null,
  },
};

export const LongName: Story = {
  args: {
    goalName: "Enchance the AI Platform with Advanced Features and Integrations",
  },
};

export const LongParentName: Story = {
  args: {
    parentGoal: {
      id: "1",
      name: "Enchance the AI Platform with Advanced Features and Integrations",
      link: "/goals/1",
    },
  },
};

export const ClosedGoal: Story = {
  args: {
    status: "achieved",
    state: "closed",
    closedAt: new Date(2025, 3, 30), // Apr 30th, 2025
    dueDate: startOfCurrentYear(),
    retrospective: {
      date: new Date(2025, 4, 1), // May 1st, 2025
      content: asRichText(
        "The AI Platform project was a success! We achieved all our targets and received positive feedback from users. The team worked exceptionally well together, and we learned valuable lessons about cross-functional collaboration and agile development.",
      ),
      link: "/retrospectives/1",
      author: genPerson(),
    },
  },
};

export const PrivateGoal: Story = {
  args: {
    accessLevels: {
      company: "no_access",
      space: "no_access",
    },
  },
};

export const NeglectedGoal: Story = {
  args: {
    neglectedGoal: true,
  },
};

export const NeglectedGoalReadOnly: Story = {
  args: {
    neglectedGoal: true,
    canEdit: false,
  },
};

export const OverdueGoal: Story = {
  args: {
    dueDate: startOfCurrentYear(),
  },
};

export const DeleteGoal: Story = {
  args: {
    deleteModalOpen: true,
  },
};

export const DeleteGoalWithSubitem: Story = {
  args: {
    deleteModalOpen: true,
    relatedWorkItems: mockRelatedWorkItems,
  },
};

export const MoveGoal: Story = {
  args: {
    moveModalOpen: true,
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
