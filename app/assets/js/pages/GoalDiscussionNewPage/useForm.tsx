import React from "react";
import { useNavigate } from "react-router-dom";

import { formValidator, useFormState } from "@/components/Form/useFormState";
import { Options, SubscriptionsState } from "@/features/Subscriptions";
import * as Goals from "@/models/goals";
import { Validators } from "@/utils/validators";

import { usePaths } from "@/routes/paths";
import { useEditor } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

type FormFields = {
  title: string;
  setTitle: (title: string) => void;
  editor: any;
};

export function useForm({ goal, subscriptionsState }: { goal: Goals.Goal; subscriptionsState: SubscriptionsState }) {
  const paths = usePaths();
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");

  const handlers = useRichEditorHandlers({ scope: { type: "goal", id: goal.id } });
  const editor = useEditor({
    placeholder: "Start a new discussion...",
    className: "min-h-[350px] py-2 text-lg",
    handlers,
  });

  const [submitting, setSubmitting] = React.useState(false);

  return useFormState<FormFields>({
    fields: {
      title: title,
      setTitle: setTitle,
      editor: editor,
    },
    validations: [
      formValidator("title", "Title is required", Validators.nonEmptyString),
      formValidator("editor", "Body is required", Validators.nonEmptyRichText),
    ],
    action: [
      async (fields: FormFields) => {
        setSubmitting(true);

        Goals.createGoalDiscussion({
          goalId: goal.id,
          title: fields.title,
          message: JSON.stringify(fields.editor.editor.getJSON()),
          sendNotificationsToEveryone: subscriptionsState.subscriptionType == Options.ALL,
          subscriberIds: subscriptionsState.currentSubscribersList,
        })
          .then((data) => navigate(paths.goalActivityPath(data.id!)))
          .finally(() => setSubmitting(false));
      },
      submitting,
    ],
  });
}
