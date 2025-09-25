import * as Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Activities from "@/models/activities";
import * as Goals from "@/models/goals";
import { PageModule } from "@/routes/types";
import * as React from "react";

import { FormTitleInput } from "@/components/FormTitleInput";
import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { Validators } from "@/utils/validators";
import { DimmedLink, Editor, PrimaryButton, useEditor } from "turboui";

import { formValidator, useFormMutationAction, useFormState } from "@/components/Form/useFormState";
import { match } from "ts-pattern";

import { usePaths } from "@/routes/paths";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
export default { name: "GoalDiscussionEditPage", loader, Page } as PageModule;

interface LoaderResult {
  activity: Activities.Activity;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    activity: await Activities.getActivity({ id: params.id }),
  };
}

function Page() {
  const paths = usePaths();
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
            {/* <TipTapEditor.StandardEditorForm editor={form.fields.editor.editor} /> */}
            <Editor editor={form.fields.editor} hideBorder padding="p-0" />
          </div>

          <div className="flex items-center gap-4 mt-4">
            <PrimaryButton testId="save" onClick={form.submit} loading={form.submitting}>
              Save
            </PrimaryButton>

            <DimmedLink to={paths.goalActivityPath(activity.id!)}>Cancel</DimmedLink>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

type FormFields = {
  title: string;
  setTitle: (title: string) => void;
  editor: any;
};

function useForm({ activity }: { activity: Activities.Activity }) {
  const paths = usePaths();
  const commentThread = activity.commentThread!;
  const [title, setTitle] = React.useState(commentThread.title!);

  const handlers = useRichEditorHandlers({ scope: { type: "goal", id: findGoalId(activity) }});
  const editor = useEditor({
    placeholder: "Start a new discussion...",
    className: "min-h-[350px] py-2 text-lg",
    content: JSON.parse(commentThread.message!),
    handlers
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
      onCompleted: (_data, navigate) => navigate(paths.goalActivityPath(activity.id!)),
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
