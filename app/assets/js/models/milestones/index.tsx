import * as People from "@/models/people";
import * as Time from "@/utils/time";
import { Milestone, MilestoneComment } from "@/api";
import { CommentSection } from "turboui";
import { Paths } from "@/routes/paths";
import { parseContextualDate } from "../contextualDates";

interface ParsedMilestonesForTurboUi {
  orderedMilestones: ReturnType<typeof parseMilestoneForTurboUi>[];
  milestonesById: Record<string, ReturnType<typeof parseMilestoneForTurboUi>>;
  orderingState: string[];
}

export type { Milestone, MilestoneComment };
export { getMilestone, usePostMilestoneComment } from "@/api";

export function parseMilestonesForTurboUi(
  paths: Paths,
  milestones: Milestone[],
  orderingState: string[] = [],
): ParsedMilestonesForTurboUi {
  const parsedMilestones = milestones.map((m) => parseMilestoneForTurboUi(paths, m));
  const milestonesById: Record<string, ReturnType<typeof parseMilestoneForTurboUi>> = {};

  parsedMilestones.forEach((milestone) => {
    milestonesById[milestone.id] = milestone;
  });

  const normalizedOrdering = normalizeOrderingState(orderingState, parsedMilestones.map((milestone) => milestone.id));

  const orderedMilestones = normalizedOrdering
    .map((id) => milestonesById[id])
    .filter((milestone): milestone is ReturnType<typeof parseMilestoneForTurboUi> => Boolean(milestone));

  return {
    orderedMilestones,
    milestonesById,
    orderingState: normalizedOrdering,
  };
}

export function parseMilestoneForTurboUi(paths: Paths, milestone: Milestone) {
  return {
    id: milestone.id,
    name: milestone.title,
    status: milestone.status,
    dueDate: parseContextualDate(milestone.timeframe?.contextualEndDate),
    link: paths.projectMilestonePath(milestone.id),
    tasksOrderingState: milestone.tasksOrderingState ?? [],
    completedAt: Time.parseDate(milestone.completedAt),
  };
}

export function parseMilestoneCommentsForTurboUi(paths: Paths, comments: MilestoneComment[] | undefined | null) {
  if (!comments) return [];

  return comments.map((comment) => parseMilestoneCommentForTurboUi(paths, comment));
}

export function parseMilestoneCommentForTurboUi(paths: Paths, comment: MilestoneComment) {
  if (comment.action === "complete") {
    return {
      id: comment.comment.id,
      type: "milestone-completed",
      insertedAt: comment.comment.insertedAt,
      author: People.parsePersonForTurboUi(paths, comment.comment.author),
    } as CommentSection.MilestoneActivity;
  } else if (comment.action === "reopen") {
    return {
      id: comment.comment.id,
      type: "milestone-reopened",
      insertedAt: comment.comment.insertedAt,
      author: People.parsePersonForTurboUi(paths, comment.comment.author),
    } as CommentSection.MilestoneActivity;
  } else {
    return {
      id: comment.comment.id,
      content: comment.comment.content || "{}",
      author: People.parsePersonForTurboUi(paths, comment.comment.author),
      insertedAt: comment.comment.insertedAt,
      reactions: [],
      notification: comment.comment.notification,
    } as CommentSection.Comment;
  }
}

export function splitByStatus(milestones: Milestone[]) {
  return {
    pending: milestones.filter((m) => m.status === "pending"),
    done: milestones.filter((m) => m.status === "done"),
  };
}

function normalizeOrderingState(orderingState: string[], milestoneIds: string[]): string[] {
  if (milestoneIds.length === 0) {
    return [];
  }

  const knownMilestoneIds = new Set(milestoneIds);
  const seen = new Set<string>();
  const normalized: string[] = [];

  (orderingState || []).forEach((id) => {
    if (!knownMilestoneIds.has(id)) return;
    if (seen.has(id)) return;

    normalized.push(id);
    seen.add(id);
  });

  milestoneIds.forEach((id) => {
    if (seen.has(id)) return;

    normalized.push(id);
    seen.add(id);
  });

  return normalized;
}
