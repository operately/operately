import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as TipTapEditor from "@/components/Editor";
import * as Api from "@/api";

import { FormTitleInput } from "@/components/FormTitleInput";
import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { InlinePeopleList } from "@/components/InlinePeopleList";
import { Validators } from "@/utils/validators";

import { useFormState, formValidator } from "@/components/Form/useFormState";
import { useMe } from "@/contexts/CurrentUserContext";
import { useNavigate } from "react-router-dom";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId, includeParentGoal: true }),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ goal });

  return (
    <Pages.Page title={["New Discussion", goal.name]}>
      <Paper.Root>
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body>
          <FormTitleInput
            value={form.fields.title}
            onChange={form.fields.setTitle}
            error={false}
            testID="discussion-title"
          />

          <div className="mt-2 border-y border-stroke-base text-content-base font-medium ">
            <TipTapEditor.StandardEditorForm editor={form.fields.editor.editor} />
          </div>

          <WhoWillBeNotified goal={goal} />

          <div className="flex items-center gap-4 mt-4">
            <FilledButton testId="post-discussion" onClick={form.submit} loading={form.submitting}>
              Post Discussion
            </FilledButton>

            <DimmedLink to={Paths.goalDiscussionsPath(goal.id)}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

type FormFields = {
  title: string;
  setTitle: (title: string) => void;
  editor: TipTapEditor.EditorState;
};

function useForm({ goal }: { goal: Goals.Goal }) {
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");

  const editor = TipTapEditor.useEditor({
    placeholder: "Start a new discussion...",
    className: "min-h-[350px] py-2 text-lg",
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

        Api.createGoalDiscussion({
          goalId: goal.id,
          title: fields.title,
          message: JSON.stringify(fields.editor.editor.getJSON()),
        })
          .then((data) => navigate(Paths.goalActivityPath(goal.id, data.id!)))
          .finally(() => setSubmitting(false));
      },
      submitting,
    ],
  });
}

function WhoWillBeNotified({ goal }: { goal: Goals.Goal }) {
  const me = useMe();
  const people = [goal.champion!, goal.reviewer!].filter((person) => person.id !== me!.id);

  return (
    <div className="mt-10 font-medium">
      <p className="font-bold">When you submit:</p>
      <div className="inline-flex gap-1 flex-wrap mt-1">
        <InlinePeopleList people={people} /> will be notified.
      </div>
    </div>
  );
}
