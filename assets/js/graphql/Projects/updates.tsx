import * as fragments from "@/graphql/Fragments";
import { gql, useQuery, useMutation } from "@apollo/client";

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
  }
`;

export const LIST_UPDATES = gql`
  query ListUpdates($filter: UpdatesFilter!) {
    updates(filter: $filter) ${UPDATE_FRAGMENT}
  }
`;

export const GET_STATUS_UPDATE = gql`
  query GetStatusUpdate($id: ID!) {
    update(id: $id) ${UPDATE_FRAGMENT}
  }
`;

export type UpdateMessageType = "message" | "status_update" | "phase_change" | "health_change" | "review";

export interface BaseUpdate {
  id: string;
  insertedAt: Date;
  updatedAt: Date;
  author: Person;

  messageType: UpdateMessageType;
  message: string;
}

export interface Review extends BaseUpdate {
  messageType: "review";
  previousPhase: string;
  newPhase: string;

  comments: Comment[];

  acknowledgingPerson: Person;
  acknowledged: boolean;
  acknowledgedAt: Date;
}

export interface HealthChange extends BaseUpdate {
  comments: Comment[];

  acknowledgingPerson: Person;
  acknowledged: boolean;
  acknowledgedAt: Date;

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

export function useListUpdates(options = {}) {
  return useQuery(LIST_UPDATES, options);
}
