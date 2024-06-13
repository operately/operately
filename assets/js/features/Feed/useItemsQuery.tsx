import { camelCaseToSnakeCase } from "@/utils/strings";

import FeedItems from "./FeedItems";
import Api from "@/api";

type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useItemsQuery(scopeType: ScopeType, scopeId: string) {
  return Api.useGetActivities({
    scopeType: scopeType,
    scopeId: scopeId,
    actions: requestedActions(),
  });
}

function requestedActions() {
  return FeedItems.map((item) => item.typename.replace("ActivityContent", "")).map(camelCaseToSnakeCase);
}
