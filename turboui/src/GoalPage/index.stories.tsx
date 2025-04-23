import type { Meta, StoryObj } from "@storybook/react";
import { GoalPage } from ".";
import { genPeople } from "../utils/storybook/genPeople";
import { genRelativeDate } from "../utils/storybook/genDates";

const meta: Meta<typeof GoalPage> = {
  title: "Pages/GoalPage",
  component: GoalPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="sm:mt-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoalPage>;

const [champion, reviewer] = genPeople(2);

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
    id: "1",
    author: champion,
    date: new Date(2025, 3, 17), // Apr 17th, 2025
    content:
      "Kickoff meeting held. Team is excited and we have outlined the initial roadmap. Next steps: finalize requirements and assign tasks.",
  },
  {
    id: "2",
    author: reviewer,
    date: new Date(2025, 3, 24), // Apr 24th, 2025
    content:
      "Reviewed the first sprint deliverables. Progress is on track, but we need to improve test coverage and documentation.",
  },
  {
    id: "3",
    author: champion,
    date: new Date(2025, 3, 30), // Apr 30th, 2025
    content:
      "Completed integration with the new data pipeline. Encountered some issues with API rate limits, but workaround is in place.",
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

const relatedWorkItems = [
  {
    id: "1",
    type: "goal" as const,
    status: "on_track",
    name: "Backend Infrastructure",
    link: "/goals/1",
    progress: 75,
    completed: false,
    subitems: [
      {
        id: "3",
        type: "project" as const,
        status: "caution",
        name: "API Development",
        link: "/projects/3",
        progress: 60,
        completed: false,
        subitems: [],
        people: genPeople(10, { random: true }),
      },
      {
        id: "4",
        type: "goal" as const,
        status: "on_track",
        name: "Database Optimization",
        link: "/goals/4",
        progress: 90,
        completed: false,
        subitems: [
          {
            id: "5",
            type: "project" as const,
            status: "on_track",
            name: "Query Performance",
            link: "/projects/5",
            progress: 100,
            completed: true,
            subitems: [],
            people: genPeople(2, { random: true }),
          },
        ],
        people: genPeople(2, { random: true }),
      },
    ],
    people: genPeople(3, { random: true }),
  },
  {
    id: "2",
    type: "goal" as const,
    status: "on_track",
    name: "UI/UX Design",
    link: "/goals/2",
    progress: 100,
    completed: true,
    people: genPeople(7, { random: true }),
    subitems: [
      {
        id: "6",
        type: "project",
        status: "on_track",
        name: "Design System",
        link: "/projects/6",
        progress: 100,
        completed: true,
        subitems: [],
        people: genPeople(3, { random: true }),
      },
    ],
  },
];

const roles = [
  "AI Backend - Champion",
  "AI Backend - Software Engineer",
  "AI Backend - Software Engineer",
  "AI Backend - Architect",
  "Landing Page for AI Platform - Champion",
  "Landing Page for AI Platform - Designer",
  "Landing Page for AI Platform - Copyeditor",
  "MCP - Champion",
  "MCP - API Designer",
  "MCP - Support Engineer",
];

const contributors = genPeople(10).map((p, i) => {
  return {
    person: p,
    role: roles[i],
  };
});

const description = [
  "Our mission is to develop and launch a cutting-edge AI platform that will revolutionize how businesses ",
  "interact with artificial intelligence. This platform will integrate advanced machine learning capabilities, ",
  "natural language processing, and automated decision-making systems to provide comprehensive AI solutions.",
  "\n",
  "\n",
  "Key features include real-time data processing, scalable infrastructure, and user-friendly interfaces ",
  "for both technical and non-technical users. The platform will support multiple AI models, custom ",
  "training pipelines, and enterprise-grade security measures.",
  "\n",
  "\n",
  "We aim to make AI technology more accessible and practical for businesses of all sizes, while ",
  "maintaining high standards of performance and reliability. This initiative aligns with our company's ",
  "strategic goal of becoming a leader in the AI solutions market and will serve as a foundation for ",
  "future AI-driven products and services.`,",
].join("");

const parentGoal = {
  name: "Accelerate product growth",
  link: "/goals/1",
};

const defaultArgs = {
  spaceLink: "/spaces/1",
  workmapLink: "/spaces/1/workmaps/1",
  goalName: "Launch AI Platform",
  spaceName: "Product",
  champion: champion,
  reviewer: reviewer,
  targets: mockTargets,
  relatedWorkItems: relatedWorkItems,
  startDate: genRelativeDate(-15),
  endDate: genRelativeDate(15),
  contributors: contributors,
  canEdit: true,
  description,
  checkIns,
  messages,
  parentGoal,
  status: "on_track",
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
    description: "",
    reviewer: null,
    status: "pending",
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
    description: "",
    reviewer: null,
    status: "pending",
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
