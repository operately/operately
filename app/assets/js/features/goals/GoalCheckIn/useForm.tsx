import { useNavigate } from "react-router-dom";
import { Update, useEditGoalProgressUpdate, usePostGoalProgressUpdate } from "@/models/goalCheckIns";
import { Goal } from "@/models/goals";

import * as Timeframes from "@/utils/timeframes";
import * as Pages from "@/components/Pages";
import * as Time from "@/utils/time";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { emptyContent } from "@/components/RichContent";
import { assertPresent } from "@/utils/assertions";
import { Options, SubscriptionsState } from "@/features/Subscriptions";
import { validateTargets } from "../GoalTargetsV2/targetErrors";

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
  const { mode, goal } = props;
  const [post] = usePostGoalProgressUpdate();
  const [edit] = useEditGoalProgressUpdate();

  const navigate = useNavigate();
  const setPageMode = Pages.useSetPageMode();

  assertPresent(goal?.timeframe, "timeframe must be present in goal");
  assertPresent(goal?.targets, "targets must be present in goal");

  const currTimeframe = {
    startDate: Time.parseDate(goal.timeframe.startDate),
    endDate: Time.parseDate(goal.timeframe.endDate),
  };

  const form = Forms.useForm({
    fields: {
      status: mode === "edit" ? props.update.status : null,
      timeframe: currTimeframe,
      targets: mode === "edit" ? props.update.goalTargetUpdates : goal.targets,
      description: mode === "edit" ? JSON.parse(props.update.message!) : emptyContent(),
    },
    cancel: () => {
      if (mode === "new") {
        navigate(Paths.goalPath(goal.id!));
      } else {
        setPageMode("view");
      }
    },
    validate: (addErrors) => {
      validateTargets(form.values.targets || [], addErrors);
    },
    submit: async () => {
      const commonAttrs = {
        status: form.values.status,
        content: JSON.stringify(form.values.description),
        newTargetValues: JSON.stringify(form.values.targets!.map((t) => ({ id: t.id, value: t.value }))),
      };

      if (mode === "new") {
        const { subscriptionsState } = props;
        const payload = {
          ...commonAttrs,
          goalId: goal.id,
          sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
          subscriberIds: subscriptionsState.currentSubscribersList,
        };
        maybeIncludeTimeframe(payload, form.values.timeframe, currTimeframe);

        const res = await post(payload);

        navigate(Paths.goalProgressUpdatePath(res.update!.id));
      } else {
        const payload = { ...commonAttrs, id: props.update.id };
        maybeIncludeTimeframe(payload, form.values.timeframe, currTimeframe);

        await edit(payload);

        setPageMode("view");
      }
    },
  });

  return form;
}

function maybeIncludeTimeframe(payload, newTimeframe, oldTimeframe) {
  const timeframesEqual = Timeframes.equalDates(
    newTimeframe as Timeframes.Timeframe,
    oldTimeframe as Timeframes.Timeframe,
  );

  if (!timeframesEqual) {
    payload.timeframe = Timeframes.serialize({ ...newTimeframe, type: "days" });
  }
}
