import type { CheckInState } from "@/api";
import { Update, useEditGoalProgressUpdate, usePostGoalProgressUpdate } from "@/models/goalCheckIns";
import { Goal } from "@/models/goals";
import { useNavigate } from "react-router";

import * as Pages from "@/components/Pages";
import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";

import { SubscriptionsState } from "@/models/subscriptions";
import { validateTargets } from "../GoalTargetsV2/targetErrors";

import { usePaths } from "@/routes/paths";
import { Forms, emptyContent } from "turboui";
import type { ScheduleFlow } from "@/hooks/useScheduleFlow";
import { useScheduleFlow } from "@/hooks/useScheduleFlow";

interface NewProps {
  mode: "new";
  goal: Goal;
  subscriptionsState: SubscriptionsState;
}

interface EditProps {
  mode: "edit";
  update: Update;
  goal: Goal;
}

export function useForm(props: EditProps | NewProps) {
  const paths = usePaths();
  const { mode, goal } = props;
  const [post] = usePostGoalProgressUpdate();
  const [edit] = useEditGoalProgressUpdate();

  const navigate = useNavigate();
  const setPageMode = Pages.useSetPageMode();

  const canSchedule =
    mode === "new" ||
    (props.mode === "edit" && (props.update.state === "draft" || props.update.state === "scheduled"));
  const scheduleFlow = useScheduleFlow({
    initialScheduledAt: mode === "edit" && canSchedule ? props.update.scheduledAt : null,
  });

  const timeframe = props.mode === "edit" ? props.update.timeframe : props.goal.timeframe;

  const form = Forms.useForm({
    fields: {
      status: mode === "edit" ? props.update.status : null,
      dueDate: parseContextualDate(timeframe?.contextualEndDate),
      targets: mode === "edit" ? props.update.goalTargetUpdates : goal.targets,
      description: mode === "edit" ? JSON.parse(props.update.message!) : emptyContent(),
      checklist: mode === "edit" ? sortByIndex(props.update.checklist || []) : sortByIndex(props.goal.checklist || []),
    },
    cancel: () => {
      if (mode === "new") {
        navigate(paths.goalPath(goal.id!));
      } else {
        setPageMode("view");
      }
    },
    validate: (addErrors) => {
      validateTargets(form.values.targets || [], addErrors);
    },
    submit: async (action: "submit" | "save-draft" | "publish-draft" | "schedule" = "submit") => {
      const status = form.values.status;
      if (!status) return;

      const targets = form.values.targets || [];
      const checklist = form.values.checklist || [];

      const commonAttrs = {
        status,
        content: JSON.stringify(form.values.description),
        newTargetValues: JSON.stringify(targets.map((t) => ({ id: t.id, value: t.value }))),
        dueDate: serializeContextualDate(form.values.dueDate),
        checklist: checklist.map((item) => ({
          id: item.id,
          completed: item.completed,
          name: item.name,
          index: item.index,
        })),
      };

      if (mode === "new") {
        const { subscriptionsState } = props;
        const shouldSchedule = action === "schedule" || (action === "submit" && scheduleFlow.isScheduledLocally);
        const payload = {
          ...commonAttrs,
          goalId: goal.id,
          postAsDraft: action === "save-draft",
          sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
          subscriberIds: subscriptionsState.currentSubscribersList,
          scheduledAt: shouldSchedule && action !== "save-draft" ? scheduleFlow.scheduledAtIso : undefined,
        };

        const res = await post(payload);

        navigate(paths.goalCheckInPath(res.update!.id));
      } else {
        const isUnpublished = props.update.state === "draft" || props.update.state === "scheduled";
        const shouldSchedule = action === "schedule" || (action === "publish-draft" && scheduleFlow.isScheduledLocally);

        let state: CheckInState | undefined;
        let scheduledAt: string | null | undefined;

        if (isUnpublished) {
          if (shouldSchedule) {
            state = "scheduled";
            scheduledAt = scheduleFlow.scheduledAtIso;
          } else if (action === "publish-draft") {
            state = "published";
          } else {
            state = "draft";
            scheduledAt = null;
          }
        }

        const payload = {
          ...commonAttrs,
          id: props.update.id!,
          state,
          scheduledAt,
        };
        await edit(payload);

        setPageMode("view");
      }
    },
  });

  return { ...form, scheduleFlow, canSchedule };
}

function sortByIndex(items: any[]) {
  return [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

export type GoalCheckInFormState = ReturnType<typeof useForm> & { scheduleFlow: ScheduleFlow; canSchedule: boolean };
