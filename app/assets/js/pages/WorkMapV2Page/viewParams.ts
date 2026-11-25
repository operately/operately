import type {
  WorkMapFilter,
  WorkMapFilterField,
  WorkMapFilterOperator,
  WorkMapSort,
  WorkMapTimelineScale,
} from "@/api";
import { mapColumns, type WorkMapViewState } from "turboui";

interface LegacyFilters {
  workTypes: string[];
  lifecycle: string[];
}

const VIEWS = ["table", "timeline"] as const;
const SORTS: WorkMapSort[] = ["map_order", "name", "due_date", "status", "progress"];
const TIMELINE_SCALES: WorkMapTimelineScale[] = ["weeks", "months", "quarters"];

const FILTER_FIELDS: WorkMapFilterField[] = [
  "work_type",
  "lifecycle",
  "name",
  "goal_status",
  "project_status",
  "space",
  "champion",
  "due_date",
  "created_date",
  "completed_date",
];
const FILTER_OPERATORS: WorkMapFilterOperator[] = [
  "is",
  "is_not",
  "is_any_of",
  "contains",
  "does_not_contain",
  "before",
  "after",
];

const LEGACY_PARAMS = ["tab", "workType", "lifecycle"];
const VIEW_PARAMS = ["view", "sort", "columns", "timelineScale", "showKpis", "filters", ...LEGACY_PARAMS];

export function readView(search: URLSearchParams, defaults: WorkMapViewState, legacy: LegacyFilters): WorkMapViewState {
  return {
    view: oneOf(search.get("view"), VIEWS) ?? defaults.view,
    sort: oneOf(search.get("sort"), SORTS) ?? defaults.sort,
    columns: readColumns(search) ?? defaults.columns,
    showKpis: readBoolean(search.get("showKpis")) ?? defaults.showKpis,
    timelineScale: oneOf(search.get("timelineScale"), TIMELINE_SCALES) ?? defaults.timelineScale,
    filters: readPersonalFilters(search) ?? readLegacyFilters(search, legacy) ?? defaults.filters,
  };
}

export function writeView(search: URLSearchParams, view: WorkMapViewState, defaults: WorkMapViewState) {
  const result = clearViewParams(search);

  if (view.view !== defaults.view) result.set("view", view.view);
  if (view.sort !== defaults.sort) result.set("sort", view.sort);
  if (view.timelineScale !== defaults.timelineScale) result.set("timelineScale", view.timelineScale);
  if (view.showKpis !== defaults.showKpis) result.set("showKpis", String(view.showKpis));
  if (!isSame(view.columns, defaults.columns)) view.columns.forEach((column) => result.append("columns", column));
  if (!isSame(view.filters, defaults.filters)) result.set("filters", JSON.stringify(view.filters));

  return result;
}

export function clearViewParams(search: URLSearchParams) {
  const result = new URLSearchParams(search);
  VIEW_PARAMS.forEach((key) => result.delete(key));
  return result;
}

export function readPersonalFilters(search: URLSearchParams): WorkMapFilter[] | undefined {
  const raw = search.get("filters");
  if (!raw) return undefined;

  try {
    const filters: unknown = JSON.parse(raw);
    return Array.isArray(filters) && filters.every(isFilter) ? filters : undefined;
  } catch {
    return undefined;
  }
}

function readLegacyFilters(search: URLSearchParams, legacy: LegacyFilters): WorkMapFilter[] | undefined {
  if (!LEGACY_PARAMS.some((key) => search.has(key))) return undefined;

  const filters: WorkMapFilter[] = [];
  if (legacy.workTypes.length) filters.push({ field: "work_type", operator: "is_any_of", values: legacy.workTypes });
  if (legacy.lifecycle.length) filters.push({ field: "lifecycle", operator: "is_any_of", values: legacy.lifecycle });
  return filters;
}

function readColumns(search: URLSearchParams) {
  if (!search.has("columns")) return undefined;

  const selected = search.getAll("columns");
  return mapColumns.filter((column) => column === "name" || selected.includes(column));
}

function readBoolean(value: string | null) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function isFilter(value: unknown): value is WorkMapFilter {
  if (typeof value !== "object" || value === null) return false;

  const { field, operator, values } = value as Record<string, unknown>;
  return (
    oneOf(field, FILTER_FIELDS) !== undefined &&
    oneOf(operator, FILTER_OPERATORS) !== undefined &&
    Array.isArray(values) &&
    values.every((v) => typeof v === "string")
  );
}

function oneOf<T>(value: unknown, options: readonly T[]): T | undefined {
  return options.find((option) => option === value);
}

function isSame(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}
