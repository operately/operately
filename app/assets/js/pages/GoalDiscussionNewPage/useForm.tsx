import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";
import { SubscriptionsState } from "@/models/subscriptions";
import * as Goals from "@/models/goals";

import { usePaths } from "@/routes/paths";
import { emptyContent, isContentEmpty } from "turboui";

type FormValues = {
  title: string;
  message: any;
};

export function useForm({ goal, subscriptionsState }: { goal: Goals.Goal; subscriptionsState: SubscriptionsState }) {
  const paths = usePaths();
  const navigate = useNavigate();
  const form = Forms.useForm<FormValues>({
    fields: {
      title: "",
      message: emptyContent(),
    },
    validate: (addError) => {
      if (isContentEmpty(form.values.message)) {
        addError("message", "Body is required");
      }
    },
    submit: async () => {
      const res = await Goals.createGoalDiscussion({
        goalId: goal.id,
        title: form.values.title,
        message: JSON.stringify(form.values.message),
        sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
        subscriberIds: subscriptionsState.currentSubscribersList,
      });

      navigate(paths.goalActivityPath(res.id!));
    },
  });

  return form;
}
