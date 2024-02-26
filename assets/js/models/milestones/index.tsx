import { gql, useMutation } from "@apollo/client";
import * as Time from "@/utils/time";

type MilestoneStatus = "pending" | "done";

export const FRAGMENT = `
  {
    id
    title
    status

    deadlineAt
    completedAt
    description
    insertedAt  

    tasksKanbanState

    comments {
      id
      action
      comment {
        id
        insertedAt
        content
        author {
          id
          name
          avatarUrl
          title
        }
      }
    }
  }
`;

export const GET_MILESTONE = gql`
  query GetMilestone($id: ID!) {
    milestone(id: $id) ${FRAGMENT}
  }
`;

export interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;

  comments: Array<{
    id: string;
    action: string;
    insertedAt: string;
    comment: any;
  }>;

  deadlineAt: string;
  completedAt: string | null;
  description: string | null;
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

  return result.concat(milestones).sort((m1, m2) => {
    let d1 = +new Date(m1.deadlineAt);
    let d2 = +new Date(m2.deadlineAt);

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
  let deadline = +new Date(milestone.deadlineAt);
  let now = +Time.today();

  return Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
}

export function isOverdue(milestone: Milestone) {
  let deadline = +new Date(milestone.deadlineAt);
  let now = +Time.today();

  return !isDone(milestone) && deadline < now;
}

export function isUpcoming(milestone: Milestone) {
  if (isDone(milestone)) return false;
  if (isOverdue(milestone)) return false;

  let deadline = +new Date(milestone.deadlineAt);
  let now = +Time.today();

  return deadline > now;
}

export function isDone(milestone: Milestone) {
  return milestone.status === "done";
}

const SET_MILESTONE_DEADLINE = gql`
  mutation SetMilestoneDeadline($milestoneId: ID!, $deadlineAt: Date) {
    setMilestoneDeadline(milestoneId: $milestoneId, deadlineAt: $deadlineAt) {
      id
    }
  }
`;

export function useSetDeadline(options = {}) {
  return useMutation(SET_MILESTONE_DEADLINE, options);
}

const REMOVE_MILESTONE = gql`
  mutation RemoveProjectMilestone($milestoneId: ID!) {
    removeProjectMilestone(milestoneId: $milestoneId) {
      id
    }
  }
`;

export function useRemoveMilestone(options = {}) {
  return useMutation(REMOVE_MILESTONE, options);
}

const UPDATE_MILESTONE_DESCRIPTION = gql`
  mutation UpdateMilestoneDescription($input: UpdateMilestoneDescriptionInput!) {
    updateMilestoneDescription(input: $input) {
      id
    }
  }
`;

export function useUpdateDescription(options = {}) {
  return useMutation(UPDATE_MILESTONE_DESCRIPTION, options);
}

const POST_MILESTONE_COMMENT = gql`
  mutation PostMilestoneComment($input: PostMilestoneCommentInput!) {
    postMilestoneComment(input: $input) {
      id
    }
  }
`;

export function usePostComment(options = {}) {
  return useMutation(POST_MILESTONE_COMMENT, options);
}

const UPDATE_MILESTONE = gql`
  mutation UpdateMilestone($input: UpdateMilestoneInput!) {
    updateMilestone(input: $input) {
      id
    }
  }
`;

export function useUpdateMilestone(options = {}) {
  return useMutation(UPDATE_MILESTONE, options);
}
