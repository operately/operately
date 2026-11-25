import { format, isValid, parseISO, subMonths, subWeeks } from "date-fns";
import type { Person, Space, WorkMapColumn, WorkMapDefaultView, WorkMapFilter, WorkMapItem } from "../ApiTypes";
import { compareIds, idWithoutComments, isUUID } from "../utils/ids";
import { dateInTimezone } from "../utils/timezone";

type MapPerson = Pick<Person, "id" | "fullName" | "avatarUrl">;
export interface WorkMapV2Item extends Pick<
  WorkMapItem,
  | "id"
  | "name"
  | "type"
  | "state"
  | "status"
  | "itemPath"
  | "progress"
  | "timeframe"
  | "spacePath"
  | "ownerPath"
  | "nextStep"
  | "insertedAt"
> {
  space: Pick<Space, "id" | "name"> | null;
  owner: MapPerson | null;
  parentId?: string | null;
  reviewer?: MapPerson | null;
  reviewerPath?: string | null;
  completedOn?: string | null;
  milestones?: WorkMapItem["milestones"];
  children: WorkMapV2Item[];
}

export type WorkMapViewState = Required<WorkMapDefaultView>;
export const mapColumns: WorkMapColumn[] = [
  "name",
  "status",
  "progress",
  "due_date",
  "space",
  "champion",
  "reviewer",
  "next_step",
];
export function builtInWorkMapView(space: boolean): WorkMapViewState {
  return {
    view: "table",
    sort: "map_order",
    columns: mapColumns.filter((c) => c !== (space ? "space" : "reviewer")),
    showKpis: true,
    timelineScale: "months",
    filters: [{ field: "lifecycle", operator: "is_any_of", values: ["active"] }],
  };
}

export interface WorkMapRow {
  item: WorkMapV2Item;
  contextOnly: boolean;
  children: WorkMapRow[];
}
export interface VisibleRow extends WorkMapRow {
  depth: number;
  expanded: boolean;
}

export function visibleRows(rows: WorkMapRow[], collapsed: Set<string>, depth = 0): VisibleRow[] {
  return rows.flatMap((row) => {
    const expanded = !collapsed.has(row.item.id);
    return [{ ...row, depth, expanded }, ...(expanded ? visibleRows(row.children, collapsed, depth + 1) : [])];
  });
}

export function referenceId(id: string) {
  return isUUID(id) ? id : (idWithoutComments(id) ?? id);
}

function boundaryDate(value: string, today: Date) {
  if (value === "past") return format(today, "yyyy-MM-dd");
  if (value === "week_ago") return format(subWeeks(today, 1), "yyyy-MM-dd");
  const months: Record<string, number> = { month_ago: 1, three_months_ago: 3, six_months_ago: 6, year_ago: 12 };
  const offset = months[value];
  if (typeof offset === "number") return format(subMonths(today, offset), "yyyy-MM-dd");
  return value;
}

function itemDate(value: string | null | undefined, timezone: string) {
  if (!value) return "";
  if (value.length === 10) return value;
  const date = parseISO(value);
  return isValid(date) ? format(dateInTimezone(date, timezone), "yyyy-MM-dd") : "";
}

function matches(item: WorkMapV2Item, filter: WorkMapFilter, today: Date, timezone: string) {
  const { operator, values, field } = filter;
  const first = values[0] ?? "";
  if (field === "name") {
    const contains = item.name.toLowerCase().includes(first.toLowerCase());
    return operator === "does_not_contain" ? !contains : contains;
  }
  if (field === "due_date" || field === "created_date" || field === "completed_date") {
    const value =
      field === "due_date"
        ? item.timeframe?.contextualEndDate?.date?.slice(0, 10)
        : itemDate(field === "created_date" ? item.insertedAt : item.completedOn, timezone);
    const boundary = boundaryDate(first, today);
    return Boolean(value && boundary && (operator === "before" ? value < boundary : value > boundary));
  }
  let value: string | undefined;
  switch (field) {
    case "space":
      value = (item.space && referenceId(item.space.id)) || undefined;
      break;
    case "champion":
      value = (item.owner && referenceId(item.owner.id)) || undefined;
      break;
    case "work_type":
      value = item.type;
      break;
    case "lifecycle":
      value = item.state;
      break;
    case "project_status":
      value = item.state === "closed" ? "closed" : item.status;
      break;
    case "goal_status":
      value = item.status;
  }
  const found = value !== undefined && values.includes(value);
  return operator === "is_not" ? !found : found;
}

export function filterWorkMap(
  items: WorkMapV2Item[],
  view: WorkMapViewState,
  order: string[],
  locale: string,
  timezone: string,
  spaceId?: string,
) {
  const counts = { goal: 0, project: 0 };
  let hasContext = false;
  const undated = { goal: 0, project: 0 };
  const today = dateInTimezone(new Date(), timezone);
  const ranks = new Map(order.map((id, index) => [referenceId(id), index]));
  const statuses = view.filters.filter((f) => f.field === "goal_status" || f.field === "project_status");
  const common = view.filters.filter((f) => !statuses.includes(f));

  function compare({ item: a }: WorkMapRow, { item: b }: WorkMapRow) {
    switch (view.sort) {
      case "name":
        return a.name.localeCompare(b.name, locale);
      case "status":
        return a.status.localeCompare(b.status);
      case "due_date":
        return (a.timeframe?.contextualEndDate?.date ?? "~").localeCompare(b.timeframe?.contextualEndDate?.date ?? "~");
      case "progress":
        return (b.progress ?? -1) - (a.progress ?? -1);
      case "map_order":
        return (ranks.get(referenceId(a.id)) ?? order.length) - (ranks.get(referenceId(b.id)) ?? order.length);
    }
  }

  function visit(items: WorkMapV2Item[]): WorkMapRow[] {
    const rows: WorkMapRow[] = [];

    for (const item of items) {
      const children = visit(item.children);
      const matched =
        (!spaceId || compareIds(item.space?.id, spaceId)) &&
        common.every((f) => matches(item, f, today, timezone)) &&
        (!statuses.length ||
          statuses.some((f) => f.field === item.type + "_status" && matches(item, f, today, timezone)));

      if (!matched && !children.length) continue;
      if (matched) {
        counts[item.type]++;
        if (!item.timeframe?.contextualStartDate?.date && !item.timeframe?.contextualEndDate?.date)
          undated[item.type]++;
      } else hasContext = true;

      rows.push({ item, children, contextOnly: !matched });
    }
    return rows.sort(compare);
  }

  const rows = visit(items);
  return { rows, counts, hasContext, undated };
}
