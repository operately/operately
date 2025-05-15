import React from "react";
import { useNavigate } from "react-router-dom";

import * as Goals from "@/models/goals";
import * as TipTapEditor from "@/components/Editor";
import { Paths } from "@/routes/paths";
import { Validators } from "@/utils/validators";
import { useFormState, formValidator } from "@/components/Form/useFormState";

type FormFields = {
  title: string;
  setTitle: (title: string) => void;
  editor: TipTapEditor.EditorState;
};

export function useForm({ goal }: { goal: Goals.Goal }) {
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");

  const editor = TipTapEditor.useEditor({
    placeholder: "Start a new discussion...",
    className: "min-h-[350px] py-2 text-lg",
    mentionSearchScope: { type: "goal", id: goal.id! },
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
        })
          .then((data) => navigate(Paths.goalActivityPath(data.id!)))
          .finally(() => setSubmitting(false));
      },
      submitting,
    ],
  });
}