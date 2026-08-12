import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { asRichText } from "../utils/storybook/richContent";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { TemplateProjectPage } from ".";
import type { TemplateProjectPage as Types } from ".";
import { defaultFormattedTimePreferences } from "../FormattedTime";

const statuses: Types.Props["statuses"] = [
  { id: "todo", value: "todo", label: "To do", color: "gray", icon: "circleDashed", index: 0 },
  { id: "progress", value: "progress", label: "In progress", color: "blue", icon: "circleDot", index: 1 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 2, closed: true },
];

const champion: Types.TemplatePerson = {
  id: "template-person-ada",
  person: { id: "ada", fullName: "Ada Lovelace", avatarUrl: null },
  role: "champion",
  responsibility: "Leads delivery",
  accessLevel: 100,
  active: true,
};

const unavailableContributor: Types.TemplatePerson = {
  id: "template-person-unavailable",
  person: null,
  role: "contributor",
  responsibility: "Coordinates launch support",
  accessLevel: 70,
  active: false,
};

const replacementCandidate = { id: "grace", fullName: "Grace Hopper", avatarUrl: null };

const populatedProps: Types.Props = {
  template: {
    id: "launch-template",
    name: "Product launch",
    description: asRichText("A reusable plan for coordinated product launches across product, marketing, and support."),
    durationDays: 30,
    milestonesOrderingState: ["beta", "launch"],
    tasksKanbanState: {},
  },
  space: { id: "product", name: "Product", link: "/spaces/product" },
  projectTemplatesLink: "/spaces/product/project-templates",
  permissions: { canView: true, canEdit: true },
  statuses,
  milestones: [
    {
      id: "beta",
      title: "Private beta",
      description: null,
      dueOffsetDays: 0,
      tasksOrderingState: ["invite"],
      tasksKanbanState: {},
    },
    {
      id: "launch",
      title: "Public launch",
      description: null,
      dueOffsetDays: 21,
      tasksOrderingState: ["announce"],
      tasksKanbanState: {},
    },
  ],
  tasks: [
    {
      id: "brief",
      name: "Write launch brief",
      description: null,
      milestoneId: null,
      priority: "high",
      size: "small",
      dueOffsetDays: 0,
      status: statuses[2]!,
      reminders: [],
    },
    {
      id: "invite",
      name: "Invite beta customers",
      description: null,
      milestoneId: "beta",
      priority: null,
      size: null,
      dueOffsetDays: 0,
      status: statuses[1]!,
      reminders: [{ type: "before_due", days: 1 }],
    },
    {
      id: "announce",
      name: "Publish announcement",
      description: null,
      milestoneId: "launch",
      priority: null,
      size: null,
      dueOffsetDays: 21,
      status: statuses[0]!,
      reminders: [{ type: "due_day" }],
      assignees: [champion, unavailableContributor],
    },
  ],
  discussions: [
    {
      id: "template-discussion-1",
      title: "Launch communication guidance",
      author: champion.person,
      date: new Date("2028-01-10T12:00:00Z"),
      link: "/project-templates/launch-template/discussions/template-discussion-1",
      content: asRichText(
        "Use this discussion to preserve context that should accompany every generated launch project.",
      ),
    },
  ],
  newDiscussionLink: "/templates/launch-template/discussions/new",
  newDocumentLink: "/templates/launch-template/documents/new",
  newLinkLink: "/templates/launch-template/links/new",
  people: [champion, unavailableContributor],
  personSearch: { people: [], onSearch: async () => undefined },
  richTextHandlers: createMockRichEditorHandlers(),
  formattedTimePreferences: defaultFormattedTimePreferences,
  onFolderCreate: async () => true,
  onFilesUpload: async () => true,
  formatFileSize: (size) => `${size} bytes`,
  onTemplateUpdate: () => undefined,
  onStatusesChange: () => undefined,
  onMilestoneCreate: () => undefined,
  onMilestoneUpdate: () => undefined,
  onMilestoneDelete: () => undefined,
  onTaskCreate: () => undefined,
  onTaskUpdate: () => undefined,
  onTaskDelete: () => undefined,
};

function TemplateStory({ props }: { props: Types.Props }) {
  const [template, setTemplate] = React.useState(props.template);
  const [statuses, setStatuses] = React.useState(props.statuses);
  const [milestones, setMilestones] = React.useState(props.milestones);
  const [tasks, setTasks] = React.useState(props.tasks);
  const [people, setPeople] = React.useState(props.people ?? []);
  const searchablePeople =
    props.personSearch.people.length > 0
      ? props.personSearch.people
      : people.flatMap((templatePerson) => (templatePerson.person ? [templatePerson.person] : []));

  const reorderMilestones = (milestoneId: string, destinationIndex: number) => {
    setMilestones((current) => {
      const sourceIndex = current.findIndex((milestone) => milestone.id === milestoneId);
      if (sourceIndex === -1) return current;

      const reordered = [...current];
      const milestone = reordered.splice(sourceIndex, 1)[0];
      if (!milestone) return current;

      reordered.splice(Math.max(0, Math.min(destinationIndex, reordered.length)), 0, milestone);
      return reordered;
    });
  };

  const deleteMilestone = (milestoneId: string) => {
    setMilestones((current) => current.filter((milestone) => milestone.id !== milestoneId));
  };

  const createMilestone: Types.Props["onMilestoneCreate"] = (milestone) => {
    setMilestones((current) => [
      ...current,
      {
        ...milestone,
        id: crypto.randomUUID(),
        tasksOrderingState: [],
        tasksKanbanState: {},
      },
    ]);
  };

  const pageProps: Types.Props = {
    ...props,
    template,
    statuses,
    milestones,
    tasks,
    people,
    personSearch: { people: searchablePeople, onSearch: async () => undefined },
    onTemplateUpdate: (updates) => setTemplate((current) => ({ ...current, ...updates })),
    onStatusesChange: ({ nextStatuses }) => setStatuses(nextStatuses),
    onMilestoneUpdate: (id, updates) =>
      setMilestones((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item))),
    onMilestoneReorder: reorderMilestones,
    onMilestoneDelete: deleteMilestone,
    onMilestoneCreate: createMilestone,
    onTaskCreate: (task) =>
      setTasks((current) => [
        ...current,
        {
          ...task,
          id: crypto.randomUUID(),
        },
      ]),
    onTaskUpdate: (id, updates) =>
      setTasks((current) => current.map((item) => (item.id === id ? { ...item, ...updates } : item))),
    onPersonCreate: (person) =>
      setPeople((current) => [...current, { ...person, id: crypto.randomUUID(), active: true }]),
    onPersonUpdate: (id, updates) =>
      setPeople((current) =>
        current.map((item) => (item.id === id ? { ...item, ...updates, active: Boolean(updates.person) } : item)),
      ),
    onPersonDelete: (id) => setPeople((current) => current.filter((item) => item.id !== id)),
  };

  return <TemplateProjectPage {...pageProps} />;
}

const meta = {
  title: "Pages/TemplateProjectPage",
  component: TemplateProjectPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TemplateProjectPage>;

export default meta;
type Story = Omit<StoryObj<typeof meta>, "args"> & {
  args?: StoryObj<typeof meta>["args"];
};

export const Populated: Story = { render: () => <TemplateStory props={populatedProps} /> };
export const Tasks: Story = {
  parameters: { reactRouter: { path: "/?tab=tasks" } },
  render: () => <TemplateStory props={populatedProps} />,
};
export const Empty: Story = {
  render: () => (
    <TemplateStory
      props={{
        ...populatedProps,
        template: { ...populatedProps.template, description: null, durationDays: null },
        milestones: [],
        tasks: [],
      }}
    />
  ),
};
export const ZeroOffsets: Story = {
  render: () => (
    <TemplateStory props={{ ...populatedProps, template: { ...populatedProps.template, durationDays: 0 } }} />
  ),
};
export const ReadOnly: Story = {
  render: () => <TemplateStory props={{ ...populatedProps, permissions: { canView: true, canComment: true } }} />,
};
export const ReplaceUnavailableContributor: Story = {
  render: () => (
    <TemplateStory
      props={{ ...populatedProps, personSearch: { people: [replacementCandidate], onSearch: async () => undefined } }}
    />
  ),
};
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" }, reactRouter: { path: "/?tab=tasks" } },
  render: () => <TemplateStory props={populatedProps} />,
};
