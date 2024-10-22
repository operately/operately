import * as Api from "@/api/socket";
import * as Local from "./broker";

export function init() {
  Local.init();
}

export enum ApiSignal {
  AssignmentsCount = "api:assignments_count",
  DiscussionCommentsChange = "api:discussion_comments",
  UnreadNotificationCount = "api:unread_notifications_count",
  ProfileUpdated = "api:profile_updated",
}

export enum LocalSignal {
  RefreshReviewCount = "local:refresh_review_count",
}

export function publish(event: LocalSignal) {
  Local.publish(event);
}

export function useAssignmentsCount(callback: () => void) {
  return Api.useSubscription(ApiSignal.AssignmentsCount, callback);
}

export function useDiscussionCommentsChangeSignal(callback: () => void, payload: { discussionId: string }) {
  return Api.useSubscription(ApiSignal.DiscussionCommentsChange, callback, payload);
}

export function useUnreadNotificationCount(callback: () => void) {
  return Api.useSubscription(ApiSignal.UnreadNotificationCount, callback);
}

export function useProfileUpdatedSignal(callback: () => void) {
  return Api.useSubscription(ApiSignal.ProfileUpdated, callback);
}

export function useReviewRefreshSignal(callback: () => void) {
  return Local.useSubscription(LocalSignal.RefreshReviewCount, callback);
}
