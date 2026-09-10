import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import { PageModule } from "@/routes/types";
import * as React from "react";
import { useNavigate } from "react-router";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { DimmedLink, Forms, emptyContent, isContentEmpty } from "turboui";

import { loader, useLoadedData } from "./loader";

import { usePaths } from "@/routes/paths";
export default { name: "GoalDiscussionEditPage", loader, Page } as PageModule;

function Page() {
  const paths = usePaths();
  const { activity, goal, commentThread } = useLoadedData();
  const form = useForm({ activity, goal, commentThread });
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "goal", id: goal.id } });

  return (
    <Pages.Page title={["New Discussion", goal.name]}>
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
                    richTextHandlers={richTextHandlers}
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
              <DimmedLink to={paths.goalActivityPath(activity.id)}>Cancel</DimmedLink>
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

function useForm({ activity, goal, commentThread }: ReturnType<typeof useLoadedData>) {
  const paths = usePaths();
  const navigate = useNavigate();
  const edit = Goals.useEditGoalDiscussion(goal.id);
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
      await edit.mutateAsync({
        activityId: activity.id,
        title: form.values.title,
        message: JSON.stringify(form.values.message),
      });

      navigate(paths.goalActivityPath(activity.id));
    },
  });

  return form;
}
