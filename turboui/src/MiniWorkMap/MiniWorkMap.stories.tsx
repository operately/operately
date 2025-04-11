import type { Meta, StoryObj } from '@storybook/react';
import { MiniWorkMap } from '.';
import { genPeople } from './../utils/storybook/genPeople';

const meta = {
  title: 'Components/MiniWorkMap',
  component: MiniWorkMap,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MiniWorkMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { 
        id: 'goal-a', 
        name: 'Goal A', 
        type: "goal", 
        link: "#", 
        completed: false, 
        progress: 0,
        people: genPeople(3, { random: true }),
        status: "on_track",
        subitems: [
          {
            id: 'goal-b', 
            name: 'Goal B', 
            type: "goal", 
            link: "#", 
            completed: false, 
            progress: 10,
            people: genPeople(3, { random: true }),
            subitems: [],
            status: "caution"
          },
          {
            id: 'project-a',
            name: 'Project A', 
            type: "project",
            link: "#", 
            completed: false, 
            progress: 50,
            people: genPeople(3, { random: true }),
            subitems: [],
            status: "on_track"
          },
          {
            id: 'project-b',
            name: 'Project B', 
            type: "project",
            link: "#", 
            completed: true,
            progress: 100,
            people: genPeople(3, { random: true }),
            subitems: [],
            status: "issue"
          }
        ] 
      }
    ]
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};
