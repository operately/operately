import * as Timeframes from "@/utils/timeframes";
import * as Pages from "@/components/Pages";
import * as Time from "@/utils/time";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Goals from "@/models/goals";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { emptyContent } from "@/components/RichContent";
import { assertPresent } from "@/utils/assertions";
import { Options, SubscriptionsState } from "@/features/Subscriptions";

interface EditProps {
  mode: "edit";
  update: GoalCheckIns.Update;
  goal: Goals.Goal;
}

interface CreateProps {
  mode: "create";
  goal: Goals.Goal;
  subscriptionsState: SubscriptionsState;
}

export function useForm(props: EditProps | CreateProps) {
  const { mode, goal } = props;
  const [post] = GoalCheckIns.usePostGoalProgressUpdate();
  const [edit] = GoalCheckIns.useEditGoalProgressUpdate();

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
      targets: initialTargets(props),
      description: mode === "edit" ? JSON.parse(props.update.message!) : emptyContent(),
    },
    cancel: () => {
      if (mode === "create") {
        navigate(Paths.goalPath(goal.id!));
      } else {
        setPageMode("view");
      }
    },
    validate: (addErrors) => {
      form.values.targets?.forEach((t, i) => {
        if (t.value === null || t.value === undefined) {
          addErrors(`targets[${i}].value`, "Can't be empty");
        }
      });
    },
    submit: async () => {
      const commonAttrs = {
        status: form.values.status,
        content: JSON.stringify(form.values.description),
        newTargetValues: JSON.stringify(form.values.targets!.map((t) => ({ id: t.id, value: t.value }))),
      };

      if (mode === "create") {
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

function initialTargets(props: EditProps | CreateProps): GoalCheckIns.Target[] {
  return props.mode === "edit"
    ? props.update.goalTargetUpdates!
    : props.goal.targets!.map((t) => ({ previousValue: t.value, ...t }));
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
