import type { Meta, StoryObj } from "@storybook/react";
import { GoalPage } from "./index";

const meta = {
  title: "Pages/GoalPage",
  component: GoalPage,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="mt-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GoalPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    spaceLink: "/spaces/1",
    workmapLink: "/spaces/1/workmaps/1",
    goalName: "Launch AI Platform",
    spaceName: "Product",
    relatedWorkItems: [
      {
        id: "1",
        type: "goal",
        status: "on_track",
        name: "Backend Infrastructure",
        link: "/goals/1",
        progress: 75,
        completed: false,
        subitems: [
          {
            id: "3",
            type: "project",
            status: "caution",
            name: "API Development",
            link: "/projects/3",
            progress: 60,
            completed: false,
            subitems: [],
            people: [
              {
                id: "1",
                fullName: "John Doe",
                avatarUrl: "https://i.pravatar.cc/150?u=1",
              },
            ],
          },
          {
            id: "4",
            type: "goal",
            status: "on_track",
            name: "Database Optimization",
            link: "/goals/4",
            progress: 90,
            completed: false,
            subitems: [
              {
                id: "5",
                type: "project",
                status: "on_track",
                name: "Query Performance",
                link: "/projects/5",
                progress: 100,
                completed: true,
                subitems: [],
                people: [
                  {
                    id: "2",
                    fullName: "Jane Smith",
                    avatarUrl: "https://i.pravatar.cc/150?u=2",
                  },
                ],
              },
            ],
            people: [
              {
                id: "2",
                fullName: "Jane Smith",
                avatarUrl: "https://i.pravatar.cc/150?u=2",
              },
            ],
          },
        ],
        people: [
          {
            id: "1",
            fullName: "John Doe",
            avatarUrl: "https://i.pravatar.cc/150?u=1",
          },
          {
            id: "2",
            fullName: "Jane Smith",
            avatarUrl: "https://i.pravatar.cc/150?u=2",
          },
        ],
      },
      {
        id: "2",
        type: "goal",
        status: "on_track",
        name: "UI/UX Design",
        link: "/goals/2",
        progress: 100,
        completed: true,
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
            people: [
              {
                id: "3",
                fullName: "Alice Johnson",
                avatarUrl: "https://i.pravatar.cc/150?u=3",
              },
            ],
          },
        ],
        people: [
          {
            id: "3",
            fullName: "Alice Johnson",
            avatarUrl: "https://i.pravatar.cc/150?u=3",
          },
        ],
      },
    ],
  },
};
