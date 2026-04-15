import { ReviewPageV2 } from "./index";

/**
 * Merges due_soon and needs_review assignment groups while maintaining sort order.
 * 
 * Both categories are already sorted by the backend. This function:
 * 1. Flattens all assignments from both categories
 * 2. Sorts them together by urgency (rank) and date
 * 3. Re-groups by origin while preserving the sorted order
 * 4. Sorts groups by their most urgent (first) assignment
 * 
 * This ensures the most urgent items appear first, regardless of whether
 * they're owner tasks (due_soon) or reviewer acknowledgements (needs_review).
 */
export function mergeUrgentGroups(
  dueSoon: ReviewPageV2.AssignmentGroup[],
  needsReview: ReviewPageV2.AssignmentGroup[]
): ReviewPageV2.AssignmentGroup[] {
  const allAssignments: ReviewPageV2.Assignment[] = [];
  dueSoon.forEach((group) => allAssignments.push(...group.assignments));
  needsReview.forEach((group) => allAssignments.push(...group.assignments));

  if (allAssignments.length === 0) {
    return [];
  }

  // Sort all assignments by urgency
  const sortedAssignments = [...allAssignments].sort((a, b) => {
    const rankA = getDueStatusRank(a.dueStatus);
    const rankB = getDueStatusRank(b.dueStatus);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }

    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    return 0;
  });

  // Group by origin while preserving sorted order
  const groupMap = new Map<string, ReviewPageV2.AssignmentGroup>();

  sortedAssignments.forEach((assignment) => {
    const key = `${assignment.origin.type}:${assignment.origin.id}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        origin: assignment.origin,
        assignments: [],
      });
    }

    groupMap.get(key)!.assignments.push(assignment);
  });

  // Sort groups by their most urgent assignment
  const groups = Array.from(groupMap.values());
  return groups.sort((a, b) => {
    const firstA = a.assignments[0];
    const firstB = b.assignments[0];

    if (!firstA || !firstB) return 0;

    const rankA = getDueStatusRank(firstA.dueStatus);
    const rankB = getDueStatusRank(firstB.dueStatus);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    if (firstA.dueDate && firstB.dueDate) {
      return new Date(firstA.dueDate).getTime() - new Date(firstB.dueDate).getTime();
    }

    return 0;
  });
}

function getDueStatusRank(status: ReviewPageV2.DueStatus | null): number {
  switch (status) {
    case "overdue":
      return 0;
    case "due_today":
      return 1;
    case "due_soon":
      return 2;
    case "upcoming":
      return 3;
    case "none":
      return 4;
    default:
      return 5;
  }
}
