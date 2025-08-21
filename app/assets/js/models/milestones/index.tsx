import * as Time from "@/utils/time";
import { Milestone, MilestoneComment } from "@/api";
import { DateField } from "turboui";
import { Paths } from "@/routes/paths";
import { parseContextualDate } from "../contextualDates";

export type { Milestone, MilestoneComment };
export {
  getMilestone,
  useUpdateMilestone,
  useRemoveProjectMilestone,
  useUpdateMilestoneDescription,
  usePostMilestoneComment,
} from "@/api";

export interface ParsedMilestone extends Pick<Milestone, "id" | "title" | "description"> {
  deletable: boolean;
  deadline: DateField.ContextualDate | null;
}

export function parseMilestonesForTurboUi(paths: Paths, milestones: Milestone[]) {
  return milestones.map((m) => parseMilestoneForTurboUi(paths, m));
}

export function parseMilestoneForTurboUi(paths: Paths, milestone: Milestone) {
  return {
    id: milestone.id,
    name: milestone.title,
    status: milestone.status,
    dueDate: parseContextualDate(milestone.timeframe?.contextualEndDate),
    link: paths.projectMilestonePath(milestone.id),
    tasksOrderingState: milestone.tasksOrderingState ?? [],
  };
}

export function filterPending(milestones: Milestone[]) {
  return milestones.filter((m) => m.status === "pending");
}

export function splitByStatus(milestones: Milestone[]) {
  return {
    pending: milestones.filter((m) => m.status === "pending"),
    done: milestones.filter((m) => m.status === "done"),
  };
}

export function sortByDeadline(milestones: Milestone[], { reverse = false } = {}) {
  let result: Milestone[] = [];

  return result.concat(milestones.map((m: Milestone) => m!)).sort((m1, m2) => {
    const d1 = m1.timeframe?.contextualEndDate?.date ? +m1.timeframe.contextualEndDate.date : Number.MAX_SAFE_INTEGER;
    const d2 = m2.timeframe?.contextualEndDate?.date ? +m2.timeframe.contextualEndDate.date : Number.MAX_SAFE_INTEGER;

    if (reverse) {
      return d2 - d1;
    } else {
      return d1 - d2;
    }
  });
}

export function sortByDoneAt(milestones: Milestone[], { reverse = false } = {}) {
  let result: Milestone[] = [];

  return result.concat(milestones).sort((m1, m2) => {
    let d1 = +Time.parse(m1.completedAt)!;
    let d2 = +Time.parse(m2.completedAt)!;

    if (reverse) {
      return d2 - d1;
    } else {
      return d1 - d2;
    }
  });
}

export function daysOverdue(milestone: Milestone) {
  if (!milestone.timeframe?.contextualEndDate?.date) return 0;
  
  const deadline = Time.parse(milestone.timeframe.contextualEndDate.date);
  if (!deadline) return 0;
  
  // If it's today or in the future, not overdue
  if (Time.isToday(deadline) || Time.isFuture(deadline)) return 0;
  
  // Calculate days difference from today
  return Math.ceil((+Time.today() - +deadline) / (1000 * 60 * 60 * 24));
}

export function isOverdue(milestone: Milestone) {
  if (!milestone.timeframe?.contextualEndDate?.date) return false;
  if (isDone(milestone)) return false;

  const deadline = Time.parse(milestone.timeframe.contextualEndDate.date);
  
  return deadline && !Time.isToday(deadline) && Time.isPast(deadline);
}

function isDone(milestone: Milestone) {
  return milestone.status === "done";
}
