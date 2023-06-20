import { gql, useMutation } from "@apollo/client";

type MilestoneStatus = "pending" | "done";

export interface Milestone {
  id: string;
  title: string;
  deadlineAt: string;
  status: MilestoneStatus;
}

export function sortByDeadline(milestones: Milestone[]) {
  let result: Milestone[] = [];

  return result.concat(milestones).sort((m1, m2) => {
    let d1 = +new Date(m1.deadlineAt);
    let d2 = +new Date(m2.deadlineAt);

    return d1 - d2;
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

export function isOverdue(milestone: Milestone) {
  let deadline = +new Date(milestone.deadlineAt);
  let now = +new Date();

  return deadline < now;
}

const ADD_MILESTONE = gql`
  mutation AddProjectMilestone(
    $projectId: ID!
    $title: String!
    $deadlineAt: Date
  ) {
    addProjectMilestone(
      projectId: $projectId
      title: $title
      deadlineAt: $deadlineAt
    ) {
      id
      title
      deadlineAt
      status
    }
  }
`;

type AddMilestoneFun = (title: string, deadlineAt: Date | null) => Promise<any>;

export function useAddMilestone(projectId: string): [AddMilestoneFun, any] {
  const [fun, status] = useMutation(ADD_MILESTONE);

  const addMilestone = (title: string, deadlineAt: Date | null) => {
    let date: string | null = null;

    if (deadlineAt) {
      date = deadlineAt.toISOString().split("T")[0] || null;
    }

    return fun({ variables: { projectId, title, deadlineAt: date } });
  };

  return [addMilestone, status];
}

const SET_MILESTONE_STATUS = gql`
  mutation SetMilestoneStatus($milestoneId: ID!, $status: String!) {
    setMilestoneStatus(milestoneId: $milestoneId, status: $status) {
      id
      status
    }
  }
`;

type SetStatusFun = (status: MilestoneStatus) => Promise<any>;

export function useSetStatus(milestoneId: string): [SetStatusFun, any] {
  const [fun, status] = useMutation(SET_MILESTONE_STATUS);

  const setStatus = (status: MilestoneStatus) => {
    return fun({ variables: { milestoneId, status } });
  };

  return [setStatus, status];
}

const UPDATE_MILESTONE = gql`
  mutation UpdateProjectMilestone(
    $milestoneId: ID!
    $title: String!
    $deadlineAt: Date
  ) {
    updateProjectMilestone(
      milestoneId: $milestoneId
      title: $title
      deadlineAt: $deadlineAt
    ) {
      id
      title
      deadlineAt
      status
    }
  }
`;

type UpdateMilestoneFun = (
  title: string,
  deadlineAt: Date | null
) => Promise<any>;

export function useUpdateMilestone(
  milestoneId: string
): [UpdateMilestoneFun, any] {
  const [fun, status] = useMutation(UPDATE_MILESTONE);

  const updateMilestone = (title: string, deadlineAt: Date | null) => {
    let date: string | null = null;

    if (deadlineAt) {
      date = deadlineAt.toISOString().split("T")[0] || null;
    }

    return fun({ variables: { milestoneId, title, deadlineAt: date } });
  };

  return [updateMilestone, status];
}

const REMOVE_MILESTONE = gql`
  mutation RemoveProjectMilestone($milestoneId: ID!) {
    removeProjectMilestone(milestoneId: $milestoneId) {
      id
    }
  }
`;

type RemoveMilestoneFun = () => Promise<any>;

export function useRemoveMilestone(
  milestoneId: string
): [RemoveMilestoneFun, any] {
  const [fun, status] = useMutation(REMOVE_MILESTONE);

  const removeMilestone = () => {
    return fun({ variables: { milestoneId } });
  };

  return [removeMilestone, status];
}
