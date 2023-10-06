import * as fragments from "@/graphql/Fragments";
import * as Milestones from "@/graphql/Projects/milestones";
import * as People from "@/graphql/People";

export type UpdateMessageType =
  | "message"
  | "review"
  | "status_update"
  | "phase_change"
  | "health_change"
  | "project_created"
  | "project_start_time_changed"
  | "project_end_time_changed"
  | "project_contributor_added"
  | "project_contributor_removed"
  | "project_milestone_created"
  | "project_milestone_deleted"
  | "project_milestone_completed"
  | "project_milestone_deadline_changed";

export const FRAGMENT = `
  {
    ... on UpdateContentMessage {
      message
    }

    ... on UpdateContentReview {
      survey
      previousPhase
      newPhase
      reviewReason
      reviewRequestId
    }

    ... on UpdateContentStatusUpdate {
      message
      oldHealth
      newHealth

      nextMilestoneId
      nextMilestoneTitle
      nextMilestoneDueDate

      phase
      phaseStart
      phaseEnd

      projectStartTime
      projectEndTime
    }

    ... on UpdateContentProjectCreated {
      champion ${fragments.PERSON}
      creator ${fragments.PERSON}
      creatorRole
    }

    ... on UpdateContentProjectStartTimeChanged {
      oldStartTime
      newStartTime
    }

    ... on UpdateContentProjectEndTimeChanged {
      oldEndTime
      newEndTime
    }

    ... on UpdateContentProjectContributorAdded {
      contributor ${fragments.PERSON}
    }

    ... on UpdateContentProjectContributorRemoved {
      contributor ${fragments.PERSON}
    }

    ... on UpdateContentProjectMilestoneCreated {
      milestone ${Milestones.FRAGMENT}
    }

    ... on UpdateContentProjectMilestoneDeleted {
      milestone ${Milestones.FRAGMENT}
    }

    ... on UpdateContentProjectMilestoneCompleted {
      milestone ${Milestones.FRAGMENT}
    }

    ... on UpdateContentProjectMilestoneDeadlineChanged {
      milestone ${Milestones.FRAGMENT}
      oldDeadline
      newDeadline
    }
  }
`;

export type Content =
  | Message
  | StatusUpdate
  | Review
  | ProjectCreated
  | ProjectStartTimeChanged
  | ProjectEndTimeChanged
  | ProjectContributorAdded
  | ProjectMilestoneCreated
  | ProjectMilestoneDeleted
  | ProjectMilestoneCompleted
  | ProjectMilestoneDeadlineChanged;

export interface StatusUpdate {
  message: string;
  oldHealth: string;
  newHealth: string;

  nextMilestoneId?: string;
  nextMilestoneTitle?: string;
  nextMilestoneDueDate?: Date;

  phase?: string;
  phaseStart?: Date;
  phaseEnd?: Date;

  projectStartTime?: Date;
  projectEndTime?: Date;
}

export interface Message {
  message: string;
}

export interface ProjectMilestoneCreated {
  milestone: Milestones.Milestone;
}

export interface ProjectMilestoneDeleted {
  milestone: Milestones.Milestone;
}

export interface ProjectMilestoneCompleted {
  milestone: Milestones.Milestone;
}

export interface ProjectMilestoneDeadlineChanged {
  milestone: Milestones.Milestone;
  oldDeadline: Date;
  newDeadline: Date;
}

export interface ProjectCreated {
  champion: People.Person;
  creator: People.Person;
  creatorRole?: string;
}

export interface ProjectStartTimeChanged {
  oldStartTime: string;
  newStartTime: string;
}

export interface ProjectEndTimeChanged {
  oldEndTime: string;
  newEndTime: string;
}

export interface ProjectContributorAdded {
  contributor: People.Person;
  contributorId: string;
  contributorRole: string;
}

export interface ProjectContributorRemoved {
  contributor: People.Person;
  contributorId: string;
  contributorRole: string;
}

export interface Review {
  survey: string;
  previousPhase: string;
  newPhase: string;
  reviewReason: string;
}
