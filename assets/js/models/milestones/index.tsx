import * as Time from "@/utils/time";
import * as Api from "@/api";

export type Milestone = Api.Milestone;
export {
  getMilestone,
  useUpdateMilestone,
  useRemoveProjectMilestone,
  useUpdateMilestoneDescription,
  usePostMilestoneComment,
} from "@/api";

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
    let d1 = +Time.parse(m1.deadlineAt)!;
    let d2 = +Time.parse(m2.deadlineAt)!;

    if (reverse) {
      return d2! - d1;
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
  let deadline = +Time.parse(milestone.deadlineAt)!;
  let now = +Time.today();

  return Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
}

export function isOverdue(milestone: Milestone) {
  let deadline = +Time.parse(milestone.deadlineAt)!;
  let now = +Time.today();

  return !isDone(milestone) && deadline < now;
}

export function isUpcoming(milestone: Milestone) {
  if (isDone(milestone)) return false;
  if (isOverdue(milestone)) return false;

  let deadline = +Time.parse(milestone.deadlineAt)!;
  let now = +Time.today();

  return deadline > now;
}

export function isDone(milestone: Milestone) {
  return milestone.status === "done";
}
