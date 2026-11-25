import type { WorkMapRow } from "./filterWorkMap";
import { move } from "./organization";

function goal(id: string, children: WorkMapRow[] = []): WorkMapRow {
  return {
    contextOnly: false,
    children,
    item: {
      id,
      name: id,
      type: "goal",
      state: "active",
      status: "on_track",
      itemPath: id,
      progress: null,
      timeframe: null,
      space: null,
      spacePath: null,
      owner: null,
      ownerPath: null,
      nextStep: "",
      children: [],
    },
  };
}

it("moves a subtree without modifying the original and records dependent parent changes in order", () => {
  const draft = { rows: [goal("a", [goal("b", [goal("c")])]), goal("d")], parentChanges: [] };
  expect(move(draft, "a", "c", "inside", true)).toBe(draft);
  const first = move(draft, "b", "d", "after", true);
  const second = move(first, "a", "b", "inside", true);
  expect(second.rows.map((r) => r.item.id)).toEqual(["d", "b"]);
  expect(second.rows[1]?.children.map((r) => r.item.id)).toEqual(["c", "a"]);
  expect(second.parentChanges.map((c) => [c.itemId, c.parentId])).toEqual([
    ["b", null],
    ["a", "b"],
  ]);
  expect(draft.rows[0]?.children[0]?.item.id).toBe("b");
});

it("allows scope editors to reorder view-only siblings without changing their parent", () => {
  const draft = { rows: [goal("a"), goal("b")], parentChanges: [] };
  expect(move(draft, "a", "b", "inside", false)).toBe(draft);
  const moved = move(draft, "a", "b", "after", false);
  expect(moved.rows.map((r) => r.item.id)).toEqual(["b", "a"]);
  expect(moved.parentChanges).toEqual([]);
});

it("lets an editable child leave a cross-space parent by dropping beside that parent", () => {
  const parent = { ...goal("external", [goal("child")]), contextOnly: true };
  const draft = { rows: [parent], parentChanges: [] };
  expect(move(draft, "child", "external", "after", false)).toBe(draft);
  expect(move(draft, "child", "external", "inside", true)).toBe(draft);

  const moved = move(draft, "child", "external", "after", true);
  expect(moved.rows.map((row) => row.item.id)).toEqual(["external", "child"]);
  expect(moved.parentChanges).toEqual([{ type: "goal", itemId: "child", parentId: null }]);
});
