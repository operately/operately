import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as TipTapEditor from "@/components/Editor";
import * as Activities from "@/models/activities";

import { FormTitleInput } from "@/components/FormTitleInput";
import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { Validators } from "@/utils/validators";

import { useFormState, formValidator, useFormMutationAction } from "@/components/Form/useFormState";

interface LoaderResult {
  goal: Goals.Goal;
  activity: Activities.Activity;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId, includeParentGoal: true }).then((data) => data.goal!),
    activity: await Activities.getActivity({ id: params.id }),
  };
}

export function Page() {
  const { goal, activity } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ goal, activity: activity });

  return (
    <Pages.Page title={["New Discussion", goal.name!]}>
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

          <div className="flex items-center gap-4 mt-4">
            <FilledButton testId="save" onClick={form.submit} loading={form.submitting}>
              Save
            </FilledButton>

            <DimmedLink to={Paths.goalActivityPath(goal.id!, activity.id!)}>Cancel</DimmedLink>
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

function useForm({ goal, activity }: { goal: Goals.Goal; activity: Activities.Activity }) {
  const commentThread = activity.commentThread!;
  const [title, setTitle] = React.useState(commentThread.title!);

  const editor = TipTapEditor.useEditor({
    placeholder: "Start a new discussion...",
    className: "min-h-[350px] py-2 text-lg",
    content: JSON.parse(commentThread.message!),
  });

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
    action: useFormMutationAction({
      mutationHook: Goals.useEditGoalDiscussionMutation,
      variables: (fields) => ({
        input: {
          activityId: activity.id,
          title: fields.title,
          message: JSON.stringify(fields.editor.editor.getJSON()),
        },
      }),
      onCompleted: (_data, navigate) => navigate(Paths.goalActivityPath(goal.id!, activity.id!)),
    }),
  });
}
