import type { WorkMapItem } from "@/api";
import { Paths } from "@/routes/paths";
import { convertToWorkMapItems } from ".";

const goal: WorkMapItem = {
  __typename: "work_map_item",
  id: "goal-1",
  name: "Launch",
  type: "goal",
  parentId: null,
  state: "active",
  status: "pending",
  taskStatus: null,
  progress: 0,
  space: { __typename: "space", id: "1cdfcb8d-a332-47b1-b589-a1f1f1a9d4bb", name: "View space" },
  spacePath: "/spaces/view-space",
  project: null,
  projectPath: null,
  owner: null,
  ownerPath: null,
  reviewer: null,
  reviewerPath: null,
  nextStep: "",
  isNew: false,
  completedOn: null,
  assignedAt: null,
  timeframe: null,
  milestones: [],
  targets: [],
  checklist: [],
  children: [],
  itemPath: "/goals/goal-1",
  privacy: "internal",
};

it("checks each destination space, including nested goals, independently of goal access", () => {
  const child = {
    ...goal,
    id: "goal-2",
    parentId: goal.id,
    space: { __typename: "space" as const, id: "2cdfcb8d-a332-47b1-b589-a1f1f1a9d4bb", name: "Edit space" },
  };
  const paths = new Paths({ companyId: "company" });
  const [parent] = convertToWorkMapItems(
    paths,
    [{ ...goal, children: [child, { ...child, id: "goal-3", space: null }] }],
    ["2cdfcb8d-a332-47b1-b589-a1f1f1a9d4bb"],
  );

  expect(parent?.canAddChildren).toBe(false);
  expect(parent?.children.map((item) => item.canAddChildren)).toEqual([true, false]);
});
