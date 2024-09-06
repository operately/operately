export { SubscribersSelector } from "./SubscribersSelector";
export { SubscribersSelectorForm } from "./selector/SubscribersSelectorForm";
export { CurrentSubscriptions } from "./CurrentSubscriptions";
export { useSubscriptions, SubscriptionsState } from "./useSubscriptions";
export { findNotifiableProjectContributors } from "./utils";

export enum Options {
  ALL = "all",
  SELECTED = "selected",
  NONE = "none",
}

export interface NotifiablePerson {
  id: string;
  avatarUrl: string;
  fullName: string;
  title: string;
}
