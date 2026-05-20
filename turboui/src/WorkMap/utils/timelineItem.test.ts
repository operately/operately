import { WorkMap } from "../components";
import { toTimelineItem } from "./timelineItem";

describe("toTimelineItem", () => {
  it("filters milestones without a valid due date", () => {
    const item = makeItem({
      milestones: [
        makeMilestone({ id: "valid", dueDate: contextualDate(new Date(2026, 4, 10, 12)) }),
        makeMilestone({ id: "missing", dueDate: null }),
        makeMilestone({ id: "invalid", dueDate: contextualDate(new Date("invalid")) }),
      ],
    });

    expect(toTimelineItem(item).milestones.map((milestone) => milestone.id)).toEqual(["valid"]);
  });

  it("maps milestone fields and sorts them by due date", () => {
    const item = makeItem({
      milestones: [
        makeMilestone({
          id: "late",
          name: "Late milestone",
          status: "pending",
          link: "/late",
          dueDate: contextualDate(new Date(2026, 5, 20, 12)),
        }),
        makeMilestone({
          id: "early",
          name: "Early milestone",
          status: "done",
          link: "/early",
          dueDate: contextualDate(new Date(2026, 4, 5, 12)),
        }),
      ],
    });

    expect(toTimelineItem(item).milestones).toEqual([
      {
        id: "early",
        name: "Early milestone",
        status: "done",
        link: "/early",
        dueDate: new Date(2026, 4, 5),
      },
      {
        id: "late",
        name: "Late milestone",
        status: "pending",
        link: "/late",
        dueDate: new Date(2026, 5, 20),
      },
    ]);
  });
});

function makeItem(overrides: Partial<WorkMap.Item> = {}): WorkMap.Item {
  return {
    id: "item-1",
    parentId: null,
    name: "Project",
    status: "on_track",
    taskStatus: null,
    progress: 0,
    project: null,
    projectPath: null,
    space: null,
    spacePath: null,
    owner: null,
    ownerPath: null,
    reviewer: null,
    reviewerPath: null,
    nextStep: "",
    isNew: false,
    children: [],
    completedOn: null,
    timeframe: null,
    milestones: [],
    type: "project",
    itemPath: "/project",
    privacy: "internal",
    ...overrides,
  };
}

function makeMilestone(overrides: Partial<WorkMap.Milestone> = {}): WorkMap.Milestone {
  return {
    id: "milestone-1",
    name: "Milestone",
    status: "pending",
    dueDate: contextualDate(new Date(2026, 4, 10, 12)),
    link: "/milestone",
    ...overrides,
  };
}

function contextualDate(date: Date): WorkMap.Milestone["dueDate"] {
  return {
    date,
    dateType: "day",
    value: Number.isNaN(date.getTime()) ? "Invalid date" : date.toISOString(),
  };
}
