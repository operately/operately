import * as Time from "@/utils/time";
import { Milestone, MilestoneComment } from "@/api";
import { DateField } from "turboui";

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
  const deadline = +(milestone.timeframe?.contextualEndDate?.date || 0);
  const now = +Time.today();

  return Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
}

export function isOverdue(milestone: Milestone) {
  if (!milestone.timeframe?.contextualEndDate?.date) return false;

  const deadline = +milestone.timeframe.contextualEndDate.date;
  const now = +Time.today();

  return !isDone(milestone) && deadline < now;
}

function isDone(milestone: Milestone) {
  return milestone.status === "done";
}
