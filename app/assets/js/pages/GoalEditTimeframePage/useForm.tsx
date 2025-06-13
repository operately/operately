import * as TipTapEditor from "@/components/Editor";
import * as Goals from "@/models/goals";
import * as Timeframes from "@/utils/timeframes";
import React from "react";

import { Options, SubscriptionsState, useSubscriptions } from "@/features/Subscriptions";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { assertPresent } from "@/utils/assertions";

interface Error {
  message: string;
}

export interface Form {
  submit: () => Promise<boolean>;
  submitting: boolean;
  timeframe: Timeframes.Timeframe;
  setTimeframe: (timeframe: Timeframes.Timeframe) => void;
  subscriptionsState: SubscriptionsState;

  commentEditor: TipTapEditor.EditorState;
  error: Error | null;
}

export function useForm({ goal }: { goal: Goals.Goal }): Form {
  assertPresent(goal.timeframe, "timeframe must be present in goal");
  assertPresent(goal.potentialSubscribers, "potentialSubscribers must be present in goal");

  const originalTimeframe = Timeframes.parse(goal.timeframe);
  const [timeframe, setTimeframe] = React.useState<Timeframes.Timeframe>(originalTimeframe);

  const navigateToGoalPage = useNavigateTo(DeprecatedPaths.goalPath(goal.id));
  const [editTimeframe, { loading: submitting }] = Goals.useEditGoalTimeframe();

  const subscriptionsState = useSubscriptions(goal.potentialSubscribers, {
    ignoreMe: true,
    notifyPrioritySubscribers: true,
  });

  const commentEditor = TipTapEditor.useEditor({
    placeholder: "Explain the reason for the change here...",
    mentionSearchScope: { type: "goal", id: goal.id! },
  });

  const [error, setError] = React.useState<{ message: string } | null>(null);

  function validate() {
    if (Timeframes.equalDates(timeframe, originalTimeframe)) {
      return { message: "The timeframe has not changed" };
    }

    return null;
  }

  async function submit() {
    const error = validate();
    if (error) {
      setError(error);
      return false;
    }

    await editTimeframe({
      id: goal.id,
      timeframe: Timeframes.serialize(timeframe),
      comment: JSON.stringify(commentEditor.editor.getJSON()),
      sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
      subscriberIds: subscriptionsState.currentSubscribersList,
    });

    navigateToGoalPage();

    return true;
  }

  return {
    submit,
    submitting,
    timeframe,
    setTimeframe,
    subscriptionsState,
    commentEditor,
    error,
  };
}
