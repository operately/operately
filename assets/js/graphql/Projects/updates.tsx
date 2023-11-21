import * as fragments from "@/graphql/Fragments";
import { gql, useQuery, useMutation } from "@apollo/client";

import * as Comments from "./comments";
import * as Reactions from "./reactions";
import * as UpdateContent from "@/graphql/Projects/update_content";

import * as Time from "@/utils/time";

export const UPDATE_FRAGMENT = `
  {
    id
    title
    message
    messageType
    updatableId

    insertedAt
    updatedAt

    author ${fragments.PERSON}
    comments ${Comments.FRAGMENT}

    acknowledgingPerson ${fragments.PERSON}
    acknowledged
    acknowledgedAt

    reactions ${Reactions.FRAGMENT}

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
  insertedAt: string;
  updatedAt: Date;
  author: Person;

  messageType: UpdateContent.UpdateMessageType;
  message: string;

  content: UpdateContent.Content;
  comments: Comment[];

  acknowledgingPerson: Person;
  acknowledged: boolean;
  acknowledgedAt: Date;

  reactions: Reaction[];
}

interface Comment {
  id: string;
  message: string;
  insertedAt: Date;
  updatedAt: Date;

  reactions: Reaction[];
}

interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
}

export interface Reaction {
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

// POST A NEW COMMENT

const POST_COMMENT_MUTATION = gql`
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

const ACKNOWLEDGE_UPDATE = gql`
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

const ADD_REACTION = gql`
  mutation AddReaction($entityID: ID!, $entityType: String!, $type: String!) {
    addReaction(entityID: $entityID, entityType: $entityType, type: $type) {
      id
    }
  }
`;

export function useReactMutation(options = {}) {
  return useMutation(ADD_REACTION, options);
}

function sortByDate(updates: Update[]): Update[] {
  return [...updates].sort((a, b) => {
    const aDate = Time.parseISO(a.insertedAt);
    const bDate = Time.parseISO(b.insertedAt);

    if (aDate > bDate) return -1;
    if (aDate < bDate) return 1;
    return 0;
  });
}

interface UpdateGroupByMonth {
  key: string;
  year: number;
  month: string;
  updates: Update[];
}

export function groupUpdatesByMonth(updates: Update[]): UpdateGroupByMonth[] {
  const groups: UpdateGroupByMonth[] = [];
  const sorted = sortByDate(updates);

  sorted.forEach((update) => {
    const date = Time.parseISO(update.insertedAt);
    const year = date.getFullYear();
    const month = Time.getMonthName(date);
    const key = `${year}-${month}`;

    if (groups.length === 0) {
      groups.push({ key, year, month, updates: [update] });
    } else {
      const lastGroup = groups[groups.length - 1]!;

      if (lastGroup.key !== key) {
        groups.push({ key, year, month, updates: [update] });
      } else {
        lastGroup.updates.push(update);
      }
    }
  });

  return groups;
}
