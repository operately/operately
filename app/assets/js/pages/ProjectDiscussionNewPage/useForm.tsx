import * as Projects from "@/models/projects";

import Api from "@/api";
import React from "react";
import { useNavigate } from "react-router-dom";

import { formValidator, useFormState } from "@/components/Form/useFormState";
import { SubscriptionsState } from "@/features/Subscriptions";
import { Validators } from "@/utils/validators";
import { useEditor } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

import { usePaths } from "@/routes/paths";

type FormFields = {
  title: string;
  setTitle: (title: string) => void;
  editor: any;
};

interface UseFormProps {
  project: Projects.Project;
  subscriptionsState: SubscriptionsState;
}

export function useForm({ project, subscriptionsState }: UseFormProps) {
  const paths = usePaths();
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");

  const handlers = useRichEditorHandlers({ scope: { type: "project", id: project.id } });
  const editor = useEditor({
    placeholder: "Start a new discussion...",
    className: "min-h-[350px] py-2 text-lg",
    handlers: handlers,
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

        Api.project_discussions
          .create({
            projectId: project.id,
            title: fields.title,
            message: JSON.stringify(fields.editor.editor.getJSON()),
            sendNotificationsToEveryone: subscriptionsState.notifyEveryone,
            subscriberIds: subscriptionsState.currentSubscribersList,
          })
          .then((data) => navigate(paths.projectDiscussionPath(data.discussion.id!)))
          .finally(() => setSubmitting(false));
      },
      submitting,
    ],
  });
}
