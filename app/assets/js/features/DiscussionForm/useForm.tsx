import * as Discussions from "@/models/discussions";
import * as Spaces from "@/models/spaces";

import { Forms, type FormState as FormsFormState } from "turboui";
import { SubscriptionsState, useSubscriptionsAdapter } from "@/models/subscriptions";
import { Subscriber } from "@/models/notifications";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router";
import { emptyContent } from "turboui";
import { assertPresent } from "@/utils/assertions";
import type { ScheduleFlow } from "@/hooks/useScheduleFlow";
import { useScheduleFlow } from "@/hooks/useScheduleFlow";

interface UseFormOptions {
  mode: "create" | "edit";
  space: Spaces.Space;
  discussion?: Discussions.Discussion;
  potentialSubscribers?: Subscriber[];
}

type FormValues = {
  title: string;
  body: any;
};

type FormAction = "post-message" | "post-draft" | "save-changes" | "publish-draft" | "schedule";

export interface FormState extends FormsFormState<FormValues> {
  mode: "create" | "edit";
  space: Spaces.Space;
  subscriptionsState: SubscriptionsState;
  scheduleFlow: ScheduleFlow;
  canSchedule: boolean;

  cancelPath: string;

  postMessage: () => void;
  postAsDraft: () => void;
  saveChanges: () => void;
  publishDraft: () => void;

  postMessageSubmitting: boolean;
  postAsDraftSubmitting: boolean;
  saveChangesSubmitting: boolean;
  publishDraftSubmitting: boolean;
  scheduleSubmitting: boolean;
}

export function useForm({ space, mode, discussion, potentialSubscribers = [] }: UseFormOptions): FormState {
  const paths = usePaths();
  const navigate = useNavigate();
  const [post] = Discussions.usePostDiscussion();
  const [edit] = Discussions.useEditDiscussion();

  const canSchedule = mode === "create" || discussion?.state === "draft" || discussion?.state === "scheduled";
  const scheduleFlow = useScheduleFlow({
    initialScheduledAt: canSchedule ? discussion?.scheduledAt : null,
  });

  const subscriptionsState = useSubscriptionsAdapter(potentialSubscribers, { ignoreMe: true, spaceName: space.name });
  const initialBody = discussion?.body ? JSON.parse(discussion.body) : emptyContent();

  const form = Forms.useForm<FormValues>({
    fields: {
      title: discussion?.title || "",
      body: initialBody,
    },
    submit: async (action?: FormAction) => {
      const resolvedAction = action ?? (mode === "edit" ? "save-changes" : "post-message");

      switch (resolvedAction) {
        case "post-message":
        case "post-draft":
        case "schedule": {
          assertPresent(space.id, "space id must be present in discussion form");
          const spaceId = space.id;
          const shouldSchedule = resolvedAction === "schedule" || scheduleFlow.isScheduledLocally;

          const res = await post({
            spaceId,
            title: form.values.title,
            postAsDraft: resolvedAction === "post-draft",
            body: JSON.stringify(form.values.body),
            sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
            subscriberIds: subscriptionsState.currentSubscribersList,
            scheduledAt: shouldSchedule && resolvedAction !== "post-draft" ? scheduleFlow.scheduledAtIso : undefined,
          });

          navigate(paths.discussionPath(res.discussion.id));
          break;
        }
        case "save-changes": {
          assertPresent(discussion, "discussion must be present in edit mode");
          assertPresent(discussion.id, "discussion id must be present in edit mode");
          const discussionId = discussion.id;

          const res = await edit({
            id: discussionId,
            title: form.values.title,
            body: JSON.stringify(form.values.body),
            ...(canSchedule && scheduleFlow.isScheduledLocally
              ? { state: "scheduled" as const, scheduledAt: scheduleFlow.scheduledAtIso }
              : canSchedule && discussion.state === "scheduled"
                ? { state: "draft" as const, scheduledAt: null }
                : {}),
          });

          navigate(paths.discussionPath(res.discussion.id));
          break;
        }
        case "publish-draft": {
          assertPresent(discussion, "discussion must be present in edit mode");
          assertPresent(discussion.id, "discussion id must be present in edit mode");
          const discussionId = discussion.id;

          if (scheduleFlow.isScheduledLocally) {
            const res = await edit({
              id: discussionId,
              title: form.values.title,
              body: JSON.stringify(form.values.body),
              state: "scheduled",
              scheduledAt: scheduleFlow.scheduledAtIso,
            });

            navigate(paths.discussionPath(res.discussion.id));
            break;
          }

          const res = await edit({
            id: discussionId,
            title: form.values.title,
            body: JSON.stringify(form.values.body),
            state: "published",
          });

          navigate(paths.discussionPath(res.discussion.id));
          break;
        }
      }
    },
  });

  const submitWith = (action: FormAction) => {
    form.actions.setTrigger(action);
    form.actions.submit(action);
  };

  const isSubmitting = form.state === "submitting";
  const postMessageSubmitting = isSubmitting && form.trigger === "post-message";
  const postAsDraftSubmitting = isSubmitting && form.trigger === "post-draft";
  const saveChangesSubmitting = isSubmitting && form.trigger === "save-changes";
  const publishDraftSubmitting = isSubmitting && form.trigger === "publish-draft";
  const scheduleSubmitting = isSubmitting && form.trigger === "schedule";

  let cancelPath: string;
  if (mode === "edit") {
    assertPresent(discussion, "discussion must be present in edit mode");
    assertPresent(discussion.id, "discussion id must be present in edit mode");
    cancelPath = paths.discussionPath(discussion.id);
  } else {
    assertPresent(space.id, "space id must be present in discussion form");
    cancelPath = paths.spaceDiscussionsPath(space.id);
  }

  return {
    ...form,
    mode,
    space,
    subscriptionsState,
    scheduleFlow,
    canSchedule,
    cancelPath,
    postMessage: () => {
      if (scheduleFlow.isScheduledLocally) {
        submitWith("schedule");
      } else {
        submitWith("post-message");
      }
    },
    postAsDraft: () => submitWith("post-draft"),
    saveChanges: () => submitWith("save-changes"),
    publishDraft: () => submitWith("publish-draft"),
    postMessageSubmitting,
    postAsDraftSubmitting,
    saveChangesSubmitting,
    publishDraftSubmitting,
    scheduleSubmitting,
  };
}
