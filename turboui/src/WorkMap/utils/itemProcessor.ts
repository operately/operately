import { WorkMap } from "../components";

const CLOSED_STATUSES = ["completed", "dropped", "achieved", "partial", "missed"];

export interface ProcessedItems {
  ongoingItems: WorkMap.Item[];
  goals: WorkMap.Item[];
  projects: WorkMap.Item[];
  completedItems: WorkMap.Item[];
  pausedItems: WorkMap.Item[];
}

export function processItems(items: WorkMap.Item[]): ProcessedItems {
  const flatCompletedItems: WorkMap.Item[] = [];
  const flatPausedItems: WorkMap.Item[] = [];
  const flatProjects: WorkMap.Item[] = [];

  const buildOngoingItemsTree = (item: WorkMap.Item): WorkMap.Item | null => {
    const isItemClosed = CLOSED_STATUSES.includes(item.status);
    const isItemPaused = item.status === "paused";

    if (isItemClosed) {
      flatCompletedItems.push({ ...item, children: [] });
    }

    if (isItemPaused) {
      flatPausedItems.push({ ...item, children: [] });
    }

    const isItemOngoing = !isItemClosed && !isItemPaused;

    if (item.type === "project" && isItemOngoing) {
      flatProjects.push({ ...item, children: [] });
    }

    const ongoingChildren: WorkMap.Item[] = [];

    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        const processedChild = buildOngoingItemsTree(child);
        if (processedChild) {
          ongoingChildren.push(processedChild);
        }
      }
    }

    // The item is included if it's either ongoing or it has at least 1 ongoing child
    if (isItemOngoing || ongoingChildren.length > 0) {
      return { ...item, children: ongoingChildren };
    }

    return null;
  };

  const ongoingItems: WorkMap.Item[] = [];
  const goalsItems: WorkMap.Item[] = [];

  for (const rootItem of items) {
    const ongoingItem = buildOngoingItemsTree(rootItem);
    if (ongoingItem) {
      ongoingItems.push(ongoingItem);
    }

    const goalItem = buildGoalsTree(rootItem);
    if (goalItem) {
      goalsItems.push(goalItem);
    }
  }

  return {
    ongoingItems,
    goals: goalsItems,
    projects: flatProjects,
    completedItems: flatCompletedItems,
    pausedItems: flatPausedItems,
  };
}

export function processPersonalItems(items: WorkMap.Item[]): ProcessedItems {
  const ongoingItems: WorkMap.Item[] = [];
  const allGoals: WorkMap.Item[] = [];
  const allProjects: WorkMap.Item[] = [];
  const completedItems: WorkMap.Item[] = [];

  const processItem = (item: WorkMap.Item) => {
    const isItemCompleted = CLOSED_STATUSES.includes(item.status);
    const isItemActive = !isItemCompleted && item.status !== "paused";

    if (isItemCompleted) {
      completedItems.push({ ...item, children: [] });
    } else {
      if (item.type === "goal") {
        allGoals.push({ ...item, children: [] });
        if (isItemActive) {
          ongoingItems.push({ ...item, children: [] });
        }
      } else if (item.type === "project") {
        allProjects.push({ ...item, children: [] });
        if (isItemActive) {
          ongoingItems.push({ ...item, children: [] });
        }
      }
    }

    // Process children recursively
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        processItem(child);
      }
    }
  };

  for (const rootItem of items) {
    processItem(rootItem);
  }

  return {
    ongoingItems,
    goals: allGoals,
    projects: allProjects,
    completedItems,
    pausedItems: [],
  };
}

const buildGoalsTree = (item: WorkMap.Item): WorkMap.Item | null => {
  if (item.type !== "goal") return null;

  const isItemClosed = CLOSED_STATUSES.includes(item.status);
  const isItemPaused = item.status === "paused";
  const isItemOngoing = !isItemClosed && !isItemPaused;

  const goalChildren: WorkMap.Item[] = [];

  if (item.children && item.children.length > 0) {
    for (const child of item.children) {
      const processedChild = buildGoalsTree(child);
      if (processedChild) {
        goalChildren.push(processedChild);
      }
    }
  }

  // The item is included if it's either ongoing or it has at least 1 ongoing child
  if (isItemOngoing || goalChildren.length > 0) {
    return { ...item, children: goalChildren };
  }

  return null;
};
