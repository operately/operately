import * as Editor from "@/components/Editor";
import { Options, SubscriptionsState } from "@/features/Subscriptions";
import * as Goals from "@/models/goals";
import { usePaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

export interface FormState {
  messageEditor: Editor.EditorState;
  submit: () => Promise<void>;
  cancelPath: string;
}

export function useForm(goal: Goals.Goal, subscriptionsState: SubscriptionsState): FormState {
  const paths = usePaths();
  const navigate = useNavigate();

  const messageEditor = Editor.useEditor({
    placeholder: "Write here...",
    className: "min-h-[200px] py-2 font-medium",
    mentionSearchScope: { type: "goal", id: goal.id! },
  });

  const goalPath = paths.goalPath(goal.id!);

  const [reopen] = Goals.useReopenGoal();

  const submit = async () => {
    await reopen({
      id: goal.id,
      message: JSON.stringify(messageEditor.editor.getJSON()),
      sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
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
