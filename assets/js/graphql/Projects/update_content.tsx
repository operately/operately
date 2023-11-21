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
  | "project_milestone_deadline_changed"
  | "project_discussion";

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

      nextMilestoneId
      nextMilestoneTitle
      nextMilestoneDueDate

      phase
      phaseStart
      phaseEnd

      projectStartTime
      projectEndTime

      health {
        status
        schedule
        budget
        team
        risks
        
        statusComments
        scheduleComments
        budgetComments
        teamComments
        risksComments
      }
    }

    ... on UpdateContentProjectDiscussion {
      title
      body
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
  | ProjectContributorRemoved
  | ProjectMilestoneCreated
  | ProjectMilestoneDeleted
  | ProjectMilestoneCompleted
  | ProjectMilestoneDeadlineChanged
  | ProjectDiscussion;

interface StatusUpdate {
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

  health: ProjectHealth;
}

export interface ProjectHealth {
  status: string;
  statusComments: string;

  schedule: string;
  scheduleComments: string;

  budget: string;
  budgetComments: string;

  team: string;
  teamComments: string;

  risks: string;
  risksComments: string;
}

interface ProjectDiscussion {
  title: string;
  body: string;
}

interface Message {
  message: string;
}

interface ProjectMilestoneCreated {
  milestone: Milestones.Milestone;
}

interface ProjectMilestoneDeleted {
  milestone: Milestones.Milestone;
}

interface ProjectMilestoneCompleted {
  milestone: Milestones.Milestone;
}

interface ProjectMilestoneDeadlineChanged {
  milestone: Milestones.Milestone;
  oldDeadline: Date;
  newDeadline: Date;
}

interface ProjectCreated {
  champion: People.Person;
  creator: People.Person;
  creatorRole?: string;
}

interface ProjectStartTimeChanged {
  oldStartTime: string;
  newStartTime: string;
}

interface ProjectEndTimeChanged {
  oldEndTime: string;
  newEndTime: string;
}

interface ProjectContributorAdded {
  contributor: People.Person;
  contributorId: string;
  contributorRole: string;
}

interface ProjectContributorRemoved {
  contributor: People.Person;
  contributorId: string;
  contributorRole: string;
}

interface Review {
  survey: string;
  previousPhase: string;
  newPhase: string;
  reviewReason: string;
}
