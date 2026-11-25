import type { WorkMapV2Filters } from "turboui";

const workTypes = ["goal", "project"] as const;
const lifecycleStates = ["active", "paused", "closed"] as const;

export function readFilters(search: URLSearchParams): WorkMapV2Filters {
  const tab = search.get("tab");
  const types = search.has("workType")
    ? workTypes.filter((type) => search.getAll("workType").includes(type))
    : workTypes.filter((type) => tab === type + "s");

  const selected = search.getAll("lifecycle");
  const lifecycle = lifecycleStates.filter((state) => selected.includes(state));

  if (!lifecycle.length && !selected.includes("all")) {
    lifecycle.push(tab === "completed" ? "closed" : tab === "paused" ? "paused" : "active");
  }

  return { workTypes: types, lifecycle };
}

export function writeFilters(search: URLSearchParams, filters: WorkMapV2Filters) {
  const result = new URLSearchParams(search);
  result.delete("tab");
  result.delete("workType");
  result.delete("lifecycle");

  for (const type of filters.workTypes) result.append("workType", type);

  if (!filters.lifecycle.length) result.set("lifecycle", "all");
  else {
    for (const state of filters.lifecycle) result.append("lifecycle", state);
  }

  return result;
}

export function legacySearch(search: URLSearchParams) {
  const { workTypes, lifecycle } = readFilters(search);
  const result = new URLSearchParams(search);
  result.delete("workType");
  result.delete("lifecycle");
  result.delete("tab");

  if (lifecycle.length === 1 && lifecycle[0] === "closed") result.set("tab", "completed");
  else if (lifecycle.length === 1 && lifecycle[0] === "paused") result.set("tab", "paused");
  else if (workTypes.length === 1) result.set("tab", workTypes[0] + "s");

  if (result.get("tab") !== "projects") result.delete("view");
  return result;
}
