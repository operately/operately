import { gql } from "@apollo/client";

import * as fragments from "@/graphql/Fragments";
import * as Milestones from "@/graphql/Projects/milestones";
import * as People from "@/graphql/People";

export type UpdateMessageType =
  | "message"
  | "status_update"
  | "phase_change"
  | "health_change"
  | "review"
  | "project_created"
  | "project_start_time_changed"
  | "project_end_time_changed"
  | "project_contributor_added"
  | "project_milestone_created"
  | "project_milestone_deleted"
  | "project_milestone_completed"
  | "project_milestone_deadline_changed";

export const FRAGMENT = `
  {
    ... on UpdateContentMessage {
      message
    }

    ... on UpdateContentStatusUpdate {
      message
      oldHealth
      newHealth
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
