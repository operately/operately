import { WorkMap } from "../components";

export interface TimelineItem {
  id: string;
  name: string;
  type: WorkMap.Item["type"];
  status: WorkMap.Item["status"];
  owner: WorkMap.Item["owner"];
  space: WorkMap.Item["space"];
  itemPath: string;
  startDate: Date | null;
  endDate: Date | null;
  milestones: TimelineMilestone[];
}

export interface TimelineMilestone {
  id: string;
  name: string;
  status: WorkMap.Milestone["status"];
  link: string;
  dueDate: Date;
}

export function flattenTimelineItems(items: WorkMap.Item[]): WorkMap.Item[] {
  return items.flatMap((item) => [item, ...flattenTimelineItems(item.children)]);
}

export function toTimelineItem(item: WorkMap.Item): TimelineItem {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    status: item.status,
    owner: item.owner,
    space: item.space,
    itemPath: item.itemPath,
    startDate: normalizeTimelineDate(item.timeframe?.startDate?.date),
    endDate: normalizeTimelineDate(item.timeframe?.endDate?.date),
    milestones: item.milestones
      .map((milestone) => {
        const dueDate = normalizeTimelineDate(milestone.dueDate?.date);
        if (!dueDate) return null;

        return {
          id: milestone.id,
          name: milestone.name,
          status: milestone.status,
          link: milestone.link,
          dueDate,
        };
      })
      .filter((milestone): milestone is TimelineMilestone => Boolean(milestone))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
  };
}

export function normalizeTimelineDate(date: Date | null | undefined) {
  if (!date) return null;

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return null;

  value.setHours(0, 0, 0, 0);
  return value;
}
