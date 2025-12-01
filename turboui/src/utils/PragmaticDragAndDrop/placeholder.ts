import type { BoardLocation } from "./types";

interface PlaceholderProjectionArgs<T> {
  items: T[];
  getId: (item: T) => string;
  draggedItemId: string | null;
  targetLocation: BoardLocation | null;
  containerId: string;
}

interface PlaceholderProjectionResult<T> {
  items: T[];
  placeholderIndex: number | null;
}

/**
 * Remove the currently dragged item from a list and compute where to show a placeholder.
 */
export function projectItemsWithPlaceholder<T>({
  items,
  getId,
  draggedItemId,
  targetLocation,
  containerId,
}: PlaceholderProjectionArgs<T>): PlaceholderProjectionResult<T> {
  if (!draggedItemId) {
    return { items, placeholderIndex: null };
  }

  const filteredItems = items.filter((item) => getId(item) !== draggedItemId);

  if (!targetLocation || targetLocation.containerId !== containerId) {
    return { items: filteredItems, placeholderIndex: null };
  }

  const boundedIndex = Math.max(0, Math.min(targetLocation.index, filteredItems.length));

  return {
    items: filteredItems,
    placeholderIndex: boundedIndex,
  };
}
