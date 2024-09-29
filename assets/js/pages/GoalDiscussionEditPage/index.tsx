import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as TipTapEditor from "@/components/Editor";
import * as Activities from "@/models/activities";
import * as Api from "@/api";

import { FormTitleInput } from "@/components/FormTitleInput";
import { PrimaryButton } from "@/components/Buttons";
import { DimmedLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { Validators } from "@/utils/validators";

import { useFormState, formValidator, useFormMutationAction } from "@/components/Form/useFormState";
import { match } from "ts-pattern";

interface LoaderResult {
  activity: Activities.Activity;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    activity: await Activities.getActivity({ id: params.id }),
  };
}

export function Page() {
  const { activity } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ activity: activity });
  const goal = Activities.getGoal(activity);

  return (
    <Pages.Page title={["New Discussion", goal.name!]}>
      <Paper.Root>
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body>
          <FormTitleInput
            value={form.fields.title}
            onChange={form.fields.setTitle}
            error={false}
            testId="discussion-title"
          />

          <div className="mt-2 border-y border-stroke-base text-content-base font-medium ">
            <TipTapEditor.StandardEditorForm editor={form.fields.editor.editor} />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <PrimaryButton testId="save" onClick={form.submit} loading={form.submitting}>
              Save
            </PrimaryButton>

            <DimmedLink to={Paths.goalActivityPath(activity.id!)}>Cancel</DimmedLink>
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

function useForm({ activity }: { activity: Activities.Activity }) {
  const commentThread = activity.commentThread!;
  const [title, setTitle] = React.useState(commentThread.title!);

  const editor = TipTapEditor.useEditor({
    placeholder: "Start a new discussion...",
    className: "min-h-[350px] py-2 text-lg",
    content: JSON.parse(commentThread.message!),
    mentionSearchScope: { type: "goal", id: findGoalId(activity) },
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
      mutationHook: Goals.useEditGoalDiscussion,
      variables: (fields) => ({
        activityId: activity.id,
        title: fields.title,
        message: JSON.stringify(fields.editor.editor.getJSON()),
      }),
      onCompleted: (_data, navigate) => navigate(Paths.goalActivityPath(activity.id!)),
    }),
  });
}

function findGoalId(activity: Api.Activity): string {
  return match(activity.action)
    .with("goal_archived", () => (activity.content as Api.ActivityContentGoalArchived).goal!.id)
    .with("goal_check_in", () => (activity.content as Api.ActivityContentGoalCheckIn).goal!.id)
    .with(
      "goal_check_in_acknowledgement",
      () => (activity.content as Api.ActivityContentGoalCheckInAcknowledgement).goal!.id,
    )
    .with("goal_closing", () => (activity.content as Api.ActivityContentGoalClosing).goal!.id)
    .with("goal_created", () => (activity.content as Api.ActivityContentGoalCreated).goal!.id)
    .with("goal_discussion_creation", () => (activity.content as Api.ActivityContentGoalDiscussionCreation).goal!.id)
    .with("goal_editing", () => (activity.content as Api.ActivityContentGoalEditing).goal!.id)
    .with("goal_reopening", () => (activity.content as Api.ActivityContentGoalReopening).goal!.id)
    .with("goal_timeframe_editing", () => (activity.content as Api.ActivityContentGoalTimeframeEditing).goal!.id)
    .run()!;
}
