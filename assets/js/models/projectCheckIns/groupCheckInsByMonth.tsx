import * as Time from "@/utils/time";

import type { ProjectCheckIn } from "./index";

export interface CheckInGroupByMonth {
  key: string;
  year: number;
  month: string;
  checkIns: ProjectCheckIn[];
}

export function groupCheckInsByMonth(checkIns: ProjectCheckIn[]): CheckInGroupByMonth[] {
  const groups: CheckInGroupByMonth[] = [];
  const sorted = sortByDate(checkIns);

  sorted.forEach((update) => {
    const date = Time.parseISO(update.insertedAt);
    const year = date.getFullYear();
    const month = Time.getMonthName(date);
    const key = `${year}-${month}`;

    if (groups.length === 0) {
      groups.push({ key, year, month, checkIns: [update] });
    } else {
      const lastGroup = groups[groups.length - 1]!;

      if (lastGroup.key !== key) {
        groups.push({ key, year, month, checkIns: [update] });
      } else {
        lastGroup.checkIns.push(update);
      }
    }
  });

  return groups;
}

function sortByDate(checkIns: ProjectCheckIn[]): ProjectCheckIn[] {
  return [...checkIns].sort((a, b) => {
    const aDate = Time.parseISO(a.insertedAt);
    const bDate = Time.parseISO(b.insertedAt);

    if (aDate > bDate) return -1;
    if (aDate < bDate) return 1;
    return 0;
  });
}
