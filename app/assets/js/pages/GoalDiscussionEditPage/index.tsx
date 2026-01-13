import * as Api from "@/api";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Activities from "@/models/activities";
import * as Goals from "@/models/goals";
import { PageModule } from "@/routes/types";
import * as React from "react";
import { useNavigate } from "react-router-dom";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import Forms from "@/components/Forms";
import { DimmedLink, emptyContent, isContentEmpty } from "turboui";

import { match } from "ts-pattern";

import { usePaths } from "@/routes/paths";
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
  const mentionSearchScope = { type: "goal", id: findGoalId(activity) } as const;

  return (
    <Pages.Page title={["New Discussion", goal.name!]}>
      <Paper.Root>
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body>
          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <div>
                <Forms.TitleInput
                  field="title"
                  placeholder="Title..."
                  autoFocus
                  testId="discussion-title"
                  errorMessage="Please add a title"
                />
                <div className="mt-2 border-y border-stroke-base text-content-base font-medium">
                  <Forms.RichTextArea
                    field="message"
                    mentionSearchScope={mentionSearchScope}
                    placeholder="Start a new discussion..."
                    hideBorder
                    height="min-h-[350px]"
                    fontSize="text-lg"
                    horizontalPadding="px-0"
                    verticalPadding="py-2"
                  />
                </div>
              </div>
            </Forms.FieldGroup>

            <Forms.FormError message="Fill out all the required fields" className="mt-4" />

            <div className="flex items-center gap-4 mt-4">
              <Forms.Submit saveText="Save" buttonSize="base" testId="save" containerClassName="mt-0" />
              <DimmedLink to={paths.goalActivityPath(activity.id!)}>Cancel</DimmedLink>
            </div>
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

type FormValues = {
  title: string;
  message: any;
};

function useForm({ activity }: { activity: Activities.Activity }) {
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = Goals.useEditGoalDiscussion();
  const commentThread = activity.commentThread!;
  const initialMessage = commentThread.message ? JSON.parse(commentThread.message) : emptyContent();

  const form = Forms.useForm<FormValues>({
    fields: {
      title: commentThread.title || "",
      message: initialMessage,
    },
    validate: (addError) => {
      if (isContentEmpty(form.values.message)) {
        addError("message", "Body is required");
      }
    },
    submit: async () => {
      await edit({
        activityId: activity.id,
        title: form.values.title,
        message: JSON.stringify(form.values.message),
      });

      navigate(paths.goalActivityPath(activity.id!));
    },
  });

  return form;
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
