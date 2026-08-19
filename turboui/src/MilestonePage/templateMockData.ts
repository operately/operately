import type { StatusSelector } from "../StatusSelector";
import type { TemplateProjectPage } from "../TemplateProjectPage";
import { asRichText } from "../utils/storybook/richContent";

export const templateStatuses: StatusSelector.StatusOption[] = [
  { id: "todo", value: "todo", label: "To do", color: "gray", icon: "circleDashed", index: 0 },
  { id: "progress", value: "progress", label: "In progress", color: "blue", icon: "circleDot", index: 1 },
  { id: "done", value: "done", label: "Done", color: "green", icon: "circleCheck", index: 2, closed: true },
];

const champion: TemplateProjectPage.TemplatePerson = {
  id: "template-person-ada",
  person: { id: "ada", fullName: "Ada Lovelace", avatarUrl: null },
  role: "champion",
  responsibility: "Leads delivery",
  accessLevel: 100,
  active: true,
};

const unavailableContributor: TemplateProjectPage.TemplatePerson = {
  id: "template-person-unavailable",
  person: null,
  role: "contributor",
  responsibility: "Coordinates launch support",
  accessLevel: 70,
  active: false,
};

export const sampleTemplateMilestones: TemplateProjectPage.Milestone[] = [
  {
    id: "beta",
    title: "Private beta",
    description: null,
    dueOffsetDays: 0,
    tasksOrderingState: ["invite"],
    tasksKanbanState: {},
    link: "/project-templates/launch-template/milestones/beta",
  },
  {
    id: "launch",
    title: "Public launch",
    description: asRichText("Coordinate the public launch activities."),
    dueOffsetDays: 21,
    tasksOrderingState: ["announce"],
    tasksKanbanState: {},
    link: "/project-templates/launch-template/milestones/launch",
  },
];

export function createSampleTemplateTasks(milestoneId: string): TemplateProjectPage.Task[] {
  const inProgress = templateStatuses[1]!;
  const todo = templateStatuses[0]!;
  const done = templateStatuses[2]!;

  if (milestoneId === "beta") {
    return [
      {
        id: "invite",
        name: "Invite beta customers",
        description: null,
        milestoneId: "beta",
        priority: null,
        size: null,
        dueOffsetDays: 0,
        status: inProgress,
        reminders: [{ type: "before_due", days: 1 }],
        assignees: [champion],
      },
      {
        id: "feedback",
        name: "Collect beta feedback",
        description: asRichText("Summarize themes from early customer conversations."),
        milestoneId: "beta",
        priority: null,
        size: null,
        dueOffsetDays: 5,
        status: todo,
        reminders: [],
      },
    ];
  }

  return [
    {
      id: "announce",
      name: "Publish announcement",
      description: null,
      milestoneId: "launch",
      priority: null,
      size: null,
      dueOffsetDays: 21,
      status: todo,
      reminders: [{ type: "due_day" }],
      assignees: [champion, unavailableContributor],
    },
    {
      id: "enablement",
      name: "Prepare support enablement",
      description: null,
      milestoneId: "launch",
      priority: null,
      size: null,
      dueOffsetDays: 18,
      status: done,
      reminders: [],
      assignees: [champion],
    },
  ];
}

export const templateStoryContext = {
  template: {
    id: "launch-template",
    name: "Product launch",
    archived: false,
  },
  space: { id: "product", name: "Product", link: "/spaces/product" },
  projectTemplatesLink: "/spaces/product/project-templates",
  templateLink: "/spaces/product/project-templates/launch-template",
  tasksCount: 4,
  discussionsCount: 1,
  docsAndFilesCount: 2,
};
