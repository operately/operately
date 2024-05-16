import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";
import * as TipTapEditor from "@/components/Editor";

import { FormTitleInput } from "@/components/FormTitleInput";
import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { InlinePeopleList } from "@/components/InlinePeopleList";
import { Validators } from "@/utils/validators";

import { useFormState, formValidator, useFormMutationAction } from "@/components/Form/useFormState";

interface LoaderResult {
  goal: Goals.Goal;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({ id: params.goalId, includeParentGoal: true }),
    me: await People.getMe({}),
  };
}

export function Page() {
  const { goal, me } = Pages.useLoadedData<LoaderResult>();
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

          <WhoWillBeNotified goal={goal} me={me} />

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

type Fields = {
  title: string;
  setTitle: (title: string) => void;
  editor: TipTapEditor.EditorState;
};

function useForm({ goal }: { goal: Goals.Goal }) {
  const [title, setTitle] = React.useState("");

  const editor = TipTapEditor.useEditor({
    placeholder: "Start a new discussion...",
    className: "min-h-[350px] py-2 text-lg",
  });

  return useFormState<Fields>({
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
      mutationHook: Goals.useCreateGoalDiscussionMutation,
      variables: (fields) => ({
        input: {
          goalId: goal.id,
          title: fields.title,
          message: JSON.stringify(fields.editor.editor.getJSON()),
        },
      }),
      onCompleted: (data, navigate) => navigate(Paths.goalActivityPath(goal.id, data.createGoalDiscussion.id)),
    }),
  });
}

function WhoWillBeNotified({ goal, me }: { goal: Goals.Goal; me: People.Person }) {
  const people = [goal.champion!, goal.reviewer!].filter((person) => person.id !== me.id);

  return (
    <div className="mt-10 font-medium">
      <p className="font-bold">When you submit:</p>
      <div className="inline-flex gap-1 flex-wrap mt-1">
        <InlinePeopleList people={people} /> will be notified.
      </div>
    </div>
  );
}
