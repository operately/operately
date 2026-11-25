import { readFilters, writeFilters } from "./filters";

it.each([
  ["all", [], ["active"]],
  ["goals", ["goal"], ["active"]],
  ["projects", ["project"], ["active"]],
  ["paused", [], ["paused"]],
  ["completed", [], ["closed"]],
])("opens existing %s links with equivalent filters", (tab, workTypes, lifecycle) => {
  const search = new URLSearchParams("tab=" + tab + "&view=timeline");
  const translated = writeFilters(search, readFilters(search));
  expect(translated.has("tab")).toBe(false);
  expect(readFilters(translated)).toEqual({ workTypes, lifecycle });
});

it("preserves combined filters and distinguishes cleared lifecycle from the active default", () => {
  const search = new URLSearchParams("view=timeline");
  for (const lifecycle of [["closed", "paused"] as const, []]) {
    const filters = { workTypes: ["project" as const], lifecycle: [...lifecycle] };
    const updated = writeFilters(search, filters);
    expect(readFilters(updated).lifecycle.sort()).toEqual([...lifecycle].sort());
    expect(updated.get("view")).toBe("timeline");
  }
});
