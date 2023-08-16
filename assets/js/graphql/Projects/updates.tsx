import * as fragments from "@/graphql/Fragments";
import { gql, useMutation } from "@apollo/client";

export const GET_STATUS_UPDATE = gql`
  query GetStatusUpdate($id: ID!) {
    update(id: $id) {
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

      project {
        id
        name
        champion ${fragments.PERSON}
        reviewer ${fragments.PERSON}
      }
    }
  }
`;

export type UpdateMessageType = "message" | "status_update" | "phase_change" | "health_change" | "review";

export interface Update {
  id: string;
  title?: string;
  message: string;
  insertedAt: Date;
  updatedAt: Date;
  messageType: UpdateMessageType;

  author: Person;

  acknowledgingPerson: Person;
  acknowledged: boolean;
  acknowledgedAt: Date;

  reactions: Reaction[];
  comments: Comment[];

  previousPhase?: string;
  newPhase?: string;

  previousHealth?: string;
  newHealth?: string;
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
