import * as api from "@/api";
import * as Time from "@/utils/time";

export type Update = api.GoalProgressUpdate;

export {
  getGoalProgressUpdate,
  getGoalProgressUpdates,
  postGoalProgressUpdate,
  editGoalProgressUpdate,
  usePostGoalProgressUpdate,
  useEditGoalProgressUpdate,
  useAcknowledgeGoalProgressUpdate,
} from "@/api";

function sortByDate(updates: Update[]): Update[] {
  return [...updates].sort((a, b) => {
    const aDate = Time.parseISO(a.insertedAt!);
    const bDate = Time.parseISO(b.insertedAt!);

    if (aDate > bDate) return -1;
    if (aDate < bDate) return 1;
    return 0;
  });
}

interface UpdateGroupByMonth {
  key: string;
  year: number;
  month: string;
  updates: Update[];
}

export function groupUpdatesByMonth(updates: Update[]): UpdateGroupByMonth[] {
  const groups: UpdateGroupByMonth[] = [];
  const sorted = sortByDate(updates);

  sorted.forEach((update) => {
    const date = Time.parseISO(update.insertedAt!);
    const year = date.getFullYear();
    const month = Time.getMonthName(date);
    const key = `${year}-${month}`;

    if (groups.length === 0) {
      groups.push({ key, year, month, updates: [update] });
    } else {
      const lastGroup = groups[groups.length - 1]!;

      if (lastGroup.key !== key) {
        groups.push({ key, year, month, updates: [update] });
      } else {
        lastGroup.updates.push(update);
      }
    }
  });

  return groups;
}
