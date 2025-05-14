import { WorkMapItem, getWorkMap } from "@/api";
import { WorkMap, TimeframeSelector } from "turboui";

/**
 * Converts an API WorkMapItem to the TurboUI WorkMap.Item type
 * This handles type differences including nullable fields and ensures
 * the structure matches exactly what the TurboUI component expects
 */
export function convertToWorkMapItem(item: WorkMapItem): WorkMap.Item {
  const convertTimeframe = (timeframe: WorkMapItem["timeframe"]) => {
    if (!timeframe) return null;

    return {
      startDate: timeframe.startDate || undefined,
      endDate: timeframe.endDate || undefined,
      type: (timeframe.type || undefined) as TimeframeSelector.TimeframeType,
    };
  };

  return {
    id: item.id,
    parentId: item.parentId,
    name: item.name,
    status: item.status,
    progress: item.progress,
    space: {
      id: item.space.id,
      name: item.space.name,
    },
    spacePath: item.spacePath,
    owner: {
      id: item.owner.id,
      fullName: item.owner.fullName,
      avatarUrl: item.owner.avatarUrl,
    },
    ownerPath: item.ownerPath,
    nextStep: item.nextStep,
    isNew: item.isNew,
    completedOn: item.completedOn,
    timeframe: convertTimeframe(item.timeframe),
    type: item.type,
    itemPath: item.itemPath,
    privacy: item.privacy,
    children: item.children.map(convertToWorkMapItem),
  };
}

export { getWorkMap };
export type { WorkMapItem };
