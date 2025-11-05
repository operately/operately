import { SubscriptionsState } from "@/features/Subscriptions";
import * as Goals from "@/models/goals";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { useEditor } from "turboui";

export interface FormState {
  messageEditor: any;
  submit: () => Promise<void>;
  cancelPath: string;
}

export function useForm(goal: Goals.Goal, subscriptionsState: SubscriptionsState): FormState {
  const paths = usePaths();
  const navigate = useNavigate();

  const handlers = useRichEditorHandlers({ scope: { type: "goal", id: goal.id } });
  const messageEditor = useEditor({
    placeholder: "Write here...",
    className: "min-h-[200px] py-2 font-medium",
    handlers
  });

  const goalPath = paths.goalPath(goal.id!);

  const [reopen] = Goals.useReopenGoal();

  const submit = async () => {
    await reopen({
      id: goal.id,
      message: JSON.stringify(messageEditor.editor.getJSON()),
      sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
      subscriberIds: subscriptionsState.currentSubscribersList,
    });
    navigate(goalPath);
  };

  return {
    messageEditor,
    cancelPath: goalPath,
    submit,
  };
}
