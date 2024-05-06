export { CommentThread } from "@/gql";

import { CommentThread, GetCommentThreadsDocument, GetCommentThreadsQueryVariables } from "@/gql";

import { makeQueryFn } from "@/graphql/client";

export const getCommentThreads = makeQueryFn(GetCommentThreadsDocument, "commentThreads") as (
  v: GetCommentThreadsQueryVariables,
) => Promise<CommentThread[]>;
