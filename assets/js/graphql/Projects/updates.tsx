import * as fragments from "@/graphql/Fragments";
import { gql, useQuery, useMutation } from "@apollo/client";

import * as UpdateContent from "@/graphql/Projects/update_content";

export const REACTION_FRAGMENT = `
  {
    id
    reactionType
    person ${fragments.PERSON}
  }
`;

export const COMMENT_FRAGMENT = `
  {
    id
    message
    insertedAt
    author ${fragments.PERSON}
    reactions ${REACTION_FRAGMENT}
  }
`;

export const UPDATE_FRAGMENT = `
  {
    id
    title
    message
    messageType

    insertedAt
    updatedAt

    author ${fragments.PERSON}
    comments ${COMMENT_FRAGMENT}

    acknowledgingPerson ${fragments.PERSON}
    acknowledged
    acknowledgedAt

    reactions ${REACTION_FRAGMENT}

    previousPhase
    newPhase

    previousHealth
    newHealth

    content ${UpdateContent.FRAGMENT}
  }
`;

export const GET_STATUS_UPDATE = gql`
  query GetStatusUpdate($id: ID!) {
    update(id: $id) ${UPDATE_FRAGMENT}
  }
`;

export interface Update {
  id: string;
  insertedAt: Date;
  updatedAt: Date;
  author: Person;

  messageType: UpdateContent.UpdateMessageType;
  message: string;

  content: UpdateContent.Content;
  comments: Comment[];

  acknowledgingPerson: Person;
  acknowledged: boolean;
  acknowledgedAt: Date;
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
