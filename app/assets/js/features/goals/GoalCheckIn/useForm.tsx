import { Update, useEditGoalProgressUpdate, usePostGoalProgressUpdate } from "@/models/goalCheckIns";
import { Goal } from "@/models/goals";
import { useNavigate } from "react-router-dom";

import * as Pages from "@/components/Pages";
import { parseContextualDate, serializeContextualDate } from "@/models/contextualDates";

import Forms from "@/components/Forms";
import { emptyContent } from "@/components/RichContent";
import { Options, SubscriptionsState } from "@/features/Subscriptions";
import { assertPresent } from "@/utils/assertions";
import { validateTargets } from "../GoalTargetsV2/targetErrors";

import { usePaths } from "@/routes/paths";

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

  assertPresent(goal?.targets, "targets must be present in goal");

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
    submit: async () => {
      const commonAttrs = {
        status: form.values.status!,
        content: JSON.stringify(form.values.description),
        newTargetValues: JSON.stringify(form.values.targets!.map((t) => ({ id: t.id, value: t.value }))),
        dueDate: serializeContextualDate(form.values.dueDate),
        checklist: form.values.checklist!.map((item) => ({
          id: item.id,
          completed: item.completed,
          name: item.name,
          index: item.index,
        })),
      };

      if (mode === "new") {
        const { subscriptionsState } = props;
        const payload = {
          ...commonAttrs,
          goalId: goal.id,
          sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
          subscriberIds: subscriptionsState.currentSubscribersList,
        };

        const res = await post(payload);

        navigate(paths.goalCheckInPath(res.update!.id));
      } else {
        const payload = { ...commonAttrs, id: props.update.id! };
        await edit(payload);

        setPageMode("view");
      }
    },
  });

  return form;
}

function sortByIndex(items: any[]) {
  return [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}
