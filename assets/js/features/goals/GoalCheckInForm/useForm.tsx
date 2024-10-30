import { useNavigate } from "react-router-dom";

import { useEditGoalProgressUpdate, usePostGoalProgressUpdate } from "@/models/goalCheckIns";
import { Target } from "@/models/goals";

import Forms from "@/components/Forms";
import { Options, SubscriptionsState } from "@/features/Subscriptions";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { CreateProps, EditProps } from "./Form";

export function useForm(props: CreateProps | EditProps, subscriptionsState: SubscriptionsState) {
  const { goal, mode } = props;

  assertPresent(goal.targets, "targets must be present in goal");

  const navigate = useNavigate();
  const [post] = usePostGoalProgressUpdate();
  const [edit] = useEditGoalProgressUpdate();

  const form = Forms.useForm({
    fields: {
      status: mode === "create" ? "" : props.update.status,
      targets: parseTargets(goal.targets),
      description: mode === "edit" && JSON.parse(props.update.message!),
    },
    validate: (addError) => {
      if (!form.values.status) {
        addError("status", "Status is required");
      }
      if (!form.values.description) {
        addError("description", "Description is required");
      }
    },
    cancel: () => {
      if (mode === "create") {
        navigate(Paths.goalPath(goal.id!));
      } else {
        navigate(Paths.goalProgressUpdatePath(props.update.id!));
      }
    },
    submit: async () => {
      if (mode === "create") {
        const res = await post({
          goalId: goal.id,
          status: form.values.status,
          content: JSON.stringify(form.values.description),
          newTargetValues: JSON.stringify(form.values.targets.map((t) => ({ id: t.id, value: parseInt(t.value!) }))),
          sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
          subscriberIds: subscriptionsState.currentSubscribersList,
        });

        navigate(Paths.goalProgressUpdatePath(res.update!.id));
      } else {
        const res = await edit({
          id: props.update.id,
          status: form.values.status,
          content: JSON.stringify(form.values.description),
          newTargetValues: JSON.stringify(form.values.targets.map((t) => ({ id: t.id, value: parseInt(t.value!) }))),
        });

        navigate(Paths.goalProgressUpdatePath(res.update!.id));
      }
    },
  });

  return form;
}

function parseTargets(targets: Target[]) {
  return targets.map((t) => ({ ...t, value: t.value?.toString() }));
}
