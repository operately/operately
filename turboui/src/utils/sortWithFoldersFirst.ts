import { parseISO } from "./time";

export type NameAndDateSortBy = "name" | "insertedAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

export interface FoldersFirstSortableItem {
  name?: string | null;
  type?: string | null;
  insertedAt?: string | null;
  updatedAt?: string | null;
}

export const NAME_AND_DATE_SORT_OPTIONS: ReadonlyArray<{ value: NameAndDateSortBy; label: string }> = [
  { value: "name", label: "Name" },
  { value: "insertedAt", label: "Creation Date" },
  { value: "updatedAt", label: "Modified Date" },
];

export function sortWithFoldersFirst<T extends FoldersFirstSortableItem>(
  items: T[],
  sortBy: NameAndDateSortBy = "name",
  sortDirection: SortDirection = "desc",
): T[] {
  const folders: T[] = [];
  const otherItems: T[] = [];

  items.forEach((item) => {
    if (item.type === "folder") {
      folders.push(item);
      return;
    }

    otherItems.push(item);
  });

  folders.sort(createSortFunction<T>("name", "asc"));
  otherItems.sort(createSortFunction<T>(sortBy, sortDirection));

  return [...folders, ...otherItems];
}

function createSortFunction<T extends FoldersFirstSortableItem>(sortBy: NameAndDateSortBy, sortDirection: SortDirection) {
  return (left: T, right: T) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = (left.name ?? "").localeCompare(right.name ?? "");
        break;
      case "insertedAt":
        comparison = compareNullableIsoDates(left.insertedAt ?? null, right.insertedAt ?? null);
        break;
      case "updatedAt":
        comparison = compareNullableIsoDates(left.updatedAt ?? null, right.updatedAt ?? null);
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  };
}

function compareNullableIsoDates(left: string | null, right: string | null): number {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  const parsedLeft = parseISO(left);
  const parsedRight = parseISO(right);

  if (parsedLeft > parsedRight) return 1;
  if (parsedLeft < parsedRight) return -1;
  return 0;
}
