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
    ...item,
    timeframe: convertTimeframe(item.timeframe),
    children: item.children.map(convertToWorkMapItem),
  };
}

export { getWorkMap };
export type { WorkMapItem };
