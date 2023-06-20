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

const SET_MILESTONE_STATUS = gql`
  mutation SetMilestoneStatus($milestoneId: ID!, $status: String!) {
    setMilestoneStatus(milestoneId: $milestoneId, status: $status) {
      id
      status
    }
  }
`;

export function useSetStatus(milestoneId: string) {
  const [fun, status] = useMutation(SET_MILESTONE_STATUS);

  const setStatus = (status: MilestoneStatus) => {
    return fun({ variables: { milestoneId, status } });
  };

  return [setStatus, status];
}
