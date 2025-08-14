import * as Api from "@/api/socket";
import * as Local from "./broker";

export function init() {
  Local.init();
}

enum ApiSignal {
  AssignmentsCount = "api:assignments_count",
  ReloadComments = "api:reload_comments",
  UnreadNotificationCount = "api:unread_notifications_count",
  ProfileUpdated = "api:profile_updated",
  NewAgentMessage = "api:new_agent_message",
}

export enum LocalSignal {
  RefreshReviewCount = "local:refresh_review_count",
  RefreshNotificationCount = "local:refresh_notification_count",
}

export function publish(event: LocalSignal) {
  Local.publish(event);
}

export function useAssignmentsCount(callback: () => void) {
  return Api.useSubscription(ApiSignal.AssignmentsCount, callback);
}

export function useReloadCommentsSignal(callback: () => void, payload: { resourceId: string }) {
  return Api.useSubscription(ApiSignal.ReloadComments, callback, payload);
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

export function useNotificationRefreshSignal(callback: () => void) {
  return Local.useSubscription(LocalSignal.RefreshNotificationCount, callback);
}

export function useNewAgentMessageSignal(callback: () => void, payload: { convoId: string }) {
  return Api.useSubscription(ApiSignal.NewAgentMessage, callback, payload);
}
