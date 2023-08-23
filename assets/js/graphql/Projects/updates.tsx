import * as fragments from "@/graphql/Fragments";
import { gql, useQuery, useMutation } from "@apollo/client";

import * as Milestones from "@/graphql/Projects/milestones";

export const UPDATE_FRAGMENT = gql`
  {
    id
    title
    message
    messageType

    insertedAt
    updatedAt

    author ${fragments.PERSON}

    comments {
      id
      message
      insertedAt
      author ${fragments.PERSON}

      reactions {
        id
        reactionType
        person ${fragments.PERSON}
      }
    }

    acknowledgingPerson ${fragments.PERSON}
    acknowledged
    acknowledgedAt

    reactions {
      id
      reactionType
      person ${fragments.PERSON}
    }

    previousPhase
    newPhase

    previousHealth
    newHealth

    content {
      __typename

      ... on UpdateContentStatusUpdate {
        message
        oldHealth
        newHealth
      }

      ... on UpdateContentProjectCreated {
        champion ${fragments.PERSON}
        creator ${fragments.PERSON}
      }

      ... on UpdateContentProjectMilestoneCreated {
        milestone ${Milestones.FRAGEMNT}
      }
    }
  }
`;

export interface UpdateContentProjectCreated {
  champion: Person;
  creator: Person;
}

export const GET_STATUS_UPDATE = gql`
  query GetStatusUpdate($id: ID!) {
    update(id: $id) ${UPDATE_FRAGMENT}
  }
`;

export type UpdateMessageType =
  | "message"
  | "status_update"
  | "phase_change"
  | "health_change"
  | "review"
  | "project_created"
  | "project_milestone_created";

export interface Update {
  id: string;
  insertedAt: Date;
  updatedAt: Date;
  author: Person;

  messageType: UpdateMessageType;
  message: string;

  content: ProjectMilestoneCreated | ProjectCreated | StatusUpdate;

  comments: Comment[];

  acknowledgingPerson: Person;
  acknowledged: boolean;
  acknowledgedAt: Date;
}

export interface ProjectMilestoneCreated {
  milestone: Milestones.Milestone;
}

export interface ProjectCreated {
  champion: Person;
  creator: Person;
}

export interface StatusUpdate {
  message: string;
  oldHealth: string;
  newHealth: string;
}

export interface Review extends Update {
  messageType: "review";
  previousPhase: string;
  newPhase: string;
}

export interface HealthChange extends Update {
  previousHealth: string;
  newHealth: string;
}

interface Comment {
  id: string;
  message: string;
  insertedAt: Date;
  updatedAt: Date;

  reactions: Reaction[];
}

export interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
}

interface Reaction {
  id: string;
  reactionType: string;
  person: Person;
}

// POST A NEW UPDATE

const POST_UPDATE = gql`
  mutation CreateUpdate($input: CreateUpdateInput!) {
    createUpdate(input: $input) {
      id
    }
  }
`;

export function usePostUpdateMutation(options = {}) {
  return useMutation(POST_UPDATE, options);
}

// LIST UPDATES

export const LIST_UPDATES = gql`
  query ListUpdates($filter: UpdatesFilter!) {
    updates(filter: $filter) ${UPDATE_FRAGMENT}
  }
`;

export function useListUpdates(options = {}) {
  return useQuery(LIST_UPDATES, options);
}

// POST A NEW COMMENT

export const POST_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      id
    }
  }
`;

export function usePostComment(options = {}) {
  return useMutation(POST_COMMENT_MUTATION, options);
}

// ACKNOWLEDGE AN UPDATE

export const ACKNOWLEDGE_UPDATE = gql`
  mutation Acknowledge($id: ID!) {
    acknowledge(id: $id) {
      id
    }
  }
`;

export function useAckUpdate(options = {}) {
  return useMutation(ACKNOWLEDGE_UPDATE, options);
}

// utils

export function splitCommentsBeforeAndAfterAck(update: Update) {
  const allComments = update.comments;
  const ackTime = update.acknowledgedAt;

  if (update.acknowledged) {
    return {
      beforeAck: allComments.filter((c) => c.insertedAt < ackTime),
      afterAck: allComments.filter((c) => c.insertedAt >= ackTime),
    };
  } else {
    return { beforeAck: update.comments, afterAck: [] };
  }
}
