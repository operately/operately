import { makeQueryFn } from "@/graphql/client";

export { useFeed } from "./useFeed";
export { groupByDate } from "./groupByDate";

export type { ActivityGroup } from "./groupByDate";
export type { Activity } from "@/gql";

import {
  Activity,
  GetActivityDocument,
  GetActivityQueryVariables,
  GetActivitiesDocument,
  GetActivitiesQueryVariables,
} from "@/gql";

export const getActivity = makeQueryFn(GetActivityDocument, "activity") as (
  v: GetActivityQueryVariables,
) => Promise<Activity>;

export const getActivities = makeQueryFn(GetActivitiesDocument, "activities") as (
  v: GetActivitiesQueryVariables,
) => Promise<Activity[]>;
