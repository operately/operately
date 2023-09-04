import { gql, useMutation } from "@apollo/client";

type MilestoneStatus = "pending" | "done";

export const FRAGMENT = `
  {
    id
    title
    status

    deadlineAt
    completedAt
  }
`;

export interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;

  deadlineAt: string;
  completedAt: string | null;
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

export function sortByStatus(milestones: Milestone[]) {
  let result: Milestone[] = [];

  return result.concat(milestones).sort((m1, m2) => {
    let s1 = m1.status;
    let s2 = m2.status;

    if (s1 === "done" && s2 === "pending") {
      return 1;
    } else if (s1 === "pending" && s2 === "done") {
      return -1;
    } else {
      return 0;
    }
  });
}

export function splitByCompletion(milestones: Milestone[]) {
  let completed: Milestone[] = [];
  let pending: Milestone[] = [];

  milestones.forEach((milestone) => {
    if (milestone.status === "done") {
      completed.push(milestone);
    } else {
      pending.push(milestone);
    }
  });

  return { completed, pending };
}

export function groupByPhase(milestones: Milestone[]) {
  let phases = ["concept", "planning", "execution", "control"];

  let results: [{ phase: string; milestones: Milestone[] }] = [
    { phase: "concept", milestones: [] as Milestone[] },
    { phase: "planning", milestones: [] as Milestone[] },
    { phase: "execution", milestones: [] as Milestone[] },
    { phase: "control", milestones: [] as Milestone[] },
  ];

  milestones.forEach((milestone) => {
    let index = phases.indexOf(milestone.phase);

    if (index >= 0) {
      results[index]!.milestones.push(milestone);
    }
  });

  results.forEach((result) => {
    result.milestones = sortByDeadline(result.milestones);
  });

  return results;
}

export function isOverdue(milestone: Milestone) {
  let deadline = +new Date(milestone.deadlineAt);
  let now = +new Date();

  return deadline < now;
}

export function parseDate(date: string | null | undefined): Date | null {
  return date ? new Date(Date.parse(date)) : null;
}

const ADD_MILESTONE = gql`
  mutation AddProjectMilestone($projectId: ID!, $title: String!, $deadlineAt: Date) {
    addProjectMilestone(projectId: $projectId, title: $title, deadlineAt: $deadlineAt) {
      id
      title
      deadlineAt
      status
    }
  }
`;

export function useAddMilestone(options = {}) {
  return useMutation(ADD_MILESTONE, options);
}

const SET_MILESTONE_STATUS = gql`
  mutation SetMilestoneStatus($milestoneId: ID!, $status: String!) {
    setMilestoneStatus(milestoneId: $milestoneId, status: $status) {
      id
      status
    }
  }
`;

export function useSetStatus(options = {}) {
  return useMutation(SET_MILESTONE_STATUS, options);
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

const UPDATE_MILESTONE = gql`
  mutation UpdateProjectMilestone($milestoneId: ID!, $title: String!, $deadlineAt: Date) {
    updateProjectMilestone(milestoneId: $milestoneId, title: $title, deadlineAt: $deadlineAt) {
      id
    }
  }
`;

export function useUpdateMilestone(options = {}) {
  return useMutation(UPDATE_MILESTONE, options);
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
