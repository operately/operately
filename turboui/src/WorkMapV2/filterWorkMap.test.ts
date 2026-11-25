import { builtInWorkMapView, filterWorkMap, visibleRows, type WorkMapV2Item } from "./filterWorkMap";

function item(id: string, fields: Partial<WorkMapV2Item> = {}): WorkMapV2Item {
  return {
    id,
    name: id,
    type: "project",
    status: "on_track",
    state: "active",
    children: [],
    progress: null,
    timeframe: null,
    space: null,
    spacePath: null,
    owner: { id: "alex-123", fullName: "Alex", avatarUrl: null },
    ownerPath: null,
    itemPath: id,
    nextStep: "",
    ...fields,
  };
}

it("combines type-specific statuses with champion, sorts siblings, and counts matches below context goals", () => {
  const tree = [
    item("parent", {
      type: "goal",
      children: [
        item("project", { status: "caution" }),
        item("other owner", { owner: null, status: "caution" }),
        item("subgoal", { type: "goal", status: "off_track" }),
        item("wrong type", { status: "off_track" }),
      ],
    }),
  ];
  const result = filterWorkMap(
    tree,
    {
      ...builtInWorkMapView(false),
      filters: [
        { field: "goal_status", operator: "is", values: ["off_track"] },
        { field: "project_status", operator: "is", values: ["caution"] },
        { field: "champion", operator: "is", values: ["123"] },
      ],
    },
    ["subgoal", "project"],
    "en",
    "UTC",
  );
  expect(result.counts).toEqual({ goal: 1, project: 1 });
  expect(visibleRows(result.rows, new Set()).map((r) => [r.item.id, r.contextOnly])).toEqual([
    ["parent", true],
    ["subgoal", false],
    ["project", false],
  ]);
  expect(visibleRows(result.rows, new Set(["parent"]))).toHaveLength(1);
});

it("uses the viewer’s local creation date and treats due dates as calendar days", () => {
  const date = "2026-11-18";
  const timeframe: WorkMapV2Item["timeframe"] = {
    __typename: "timeframe",
    contextualStartDate: null,
    contextualEndDate: { __typename: "contextual_date", dateType: "day", date, value: date },
  };
  const tree = [
    item("late night", { insertedAt: date + "T02:30:00Z", timeframe }),
    item("next morning", { insertedAt: date + "T12:00:00Z", timeframe }),
    item("undated"),
  ];
  const result = filterWorkMap(
    tree,
    {
      ...builtInWorkMapView(false),
      filters: [
        { field: "created_date", operator: "before", values: [date] },
        { field: "due_date", operator: "after", values: ["2026-11-17"] },
      ],
    },
    [],
    "en",
    "America/Sao_Paulo",
  );
  expect(result.rows.map((r) => r.item.id)).toEqual(["late night"]);
});

it("keeps an ancestor from another space only as context for matching work in the current space", () => {
  const tree = [
    item("company objective", {
      type: "goal",
      space: { id: "general-123", name: "General" },
      children: [item("release", { space: { id: "product-456", name: "Product" } })],
    }),
  ];
  const result = filterWorkMap(tree, builtInWorkMapView(true), [], "en", "UTC", "456");
  expect(result.rows[0]?.contextOnly).toBe(true);
  expect(result.counts).toEqual({ goal: 0, project: 1 });
});

it("includes both closure outcomes when filtering for completed projects", () => {
  const tree = [
    item("achieved", { status: "achieved", state: "closed" }),
    item("missed", { status: "missed", state: "closed" }),
    item("active"),
  ];
  const view = builtInWorkMapView(false);
  view.filters = [{ field: "project_status", operator: "is", values: ["closed"] }];
  expect(filterWorkMap(tree, view, [], "en", "UTC").counts.project).toBe(2);
});
