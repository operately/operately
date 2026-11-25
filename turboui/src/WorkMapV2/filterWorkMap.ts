import type { Person, Space, WorkMapItem, WorkMapItemState, WorkMapItemType } from "../ApiTypes";

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
> {
  space: Pick<Space, "name"> | null;
  owner: Pick<Person, "id" | "fullName" | "avatarUrl"> | null;
  children: WorkMapV2Item[];
}

export interface WorkMapV2Filters {
  workTypes: WorkMapItemType[];
  lifecycle: WorkMapItemState[];
}

export const defaultWorkMapV2Filters: WorkMapV2Filters = { workTypes: [], lifecycle: ["active"] };

export interface WorkMapRow {
  item: WorkMapV2Item;
  contextOnly: boolean;
  children: WorkMapRow[];
}

export function filterWorkMap(items: WorkMapV2Item[], filters: WorkMapV2Filters) {
  const counts = { goal: 0, project: 0 };
  let hasContext = false;

  function visit(items: WorkMapV2Item[]): WorkMapRow[] {
    const rows: WorkMapRow[] = [];
    for (const item of items) {
      const children = visit(item.children);
      const matches =
        (!filters.workTypes.length || filters.workTypes.includes(item.type)) &&
        (!filters.lifecycle.length || filters.lifecycle.includes(item.state));

      if (!matches && !children.length) continue;
      if (matches) counts[item.type]++;
      else hasContext = true;
      rows.push({ item, children, contextOnly: !matches });
    }
    return rows;
  }

  const rows = visit(items);
  return { rows, counts, hasContext };
}
