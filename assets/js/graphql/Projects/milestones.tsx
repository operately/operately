import { gql, useMutation } from "@apollo/client";
import * as Comments from "./comments";
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

    comments {
      id
      action
      comment ${Comments.FRAGMENT}
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

  deadlineAt: string;
  completedAt: string | null;
  description: string | null;
}

export function filterPending(milestones: Milestone[]) {
  return milestones.filter((m) => m.status === "pending");
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

const UPDATE_MILESTONE_TITLE = gql`
  mutation UpdateMilestoneTitle($input: UpdateMilestoneTitleInput!) {
    updateMilestoneTitle(input: $input) {
      id
    }
  }
`;

export function useUpdateTitle(options = {}) {
  return useMutation(UPDATE_MILESTONE_TITLE, options);
}
