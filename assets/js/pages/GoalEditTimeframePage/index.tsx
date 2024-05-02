import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Paper from "@/components/PaperContainer";
import * as Timeframes from "@/utils/timeframes";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { FilledButton } from "@/components/Button";
import { InlinePeopleList } from "@/components/InlinePeopleList";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { Paths } from "@/routes/paths";
import { DimmedLink } from "@/components/Link";

interface LoaderResult {
  goal: Goals.Goal;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    me: await People.getMe({}),
    goal: await Goals.getGoal({ id: params.goalId }),
  };
}

export function Page() {
  const { goal, me } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ goal });

  return (
    <Pages.Page title={["Edit Timeframe", goal.name]}>
      <Paper.Root size="small">
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body minHeight="300px">
          <Title />
          <Subtitle goal={goal} />

          <div>
            <p className="font-bold mb-1">Select new timeframe</p>
            <TimeframeSelector timeframe={form.timeframe} setTimeframe={form.setTimeframe} />
          </div>

          <Comments form={form} />

          <WhoWillBeNotified goal={goal} me={me} />

          <Submit goal={goal} form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  return <div className="text-content-accent text-2xl font-extrabold">Editing the Goal's Timeframe</div>;
}

function Subtitle({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="mb-8">
      <div className="text-content-accent">
        Current timeframe: {Timeframes.format(Timeframes.parse(goal.timeframe))}
      </div>
    </div>
  );
}

function Comments({ form }: { form: Form }) {
  return (
    <div className="mt-8">
      <p className="font-bold mb-1">
        Comment <span className="text-content-dimmed font-normal">(optional)</span>
      </p>
      <Editor editor={form.commentEditor.editor} />
    </div>
  );
}

function Submit({ goal, form }: { goal: Goals.Goal; form: Form }) {
  return (
    <div className="flex items-center gap-4 mt-6">
      <FilledButton
        type="primary"
        onClick={form.submit}
        loading={form.submitting}
        size="base"
        testId="submit-check-in"
        bzzzOnClickFailure
      >
        Submit
      </FilledButton>

      <DimmedLink to={Paths.goalPath(goal.id)}>Cancel</DimmedLink>
    </div>
  );
}

function WhoWillBeNotified({ goal, me }: { goal: Goals.Goal; me: People.Person }) {
  const people = [goal.champion!, goal.reviewer!].filter((person) => person.id !== me.id);

  return (
    <div className="mt-8 font-medium">
      <p className="font-bold">When you submit:</p>
      <div className="inline-flex gap-1 flex-wrap mt-1">
        <InlinePeopleList people={people} /> will be notified.
      </div>
    </div>
  );
}

function Editor({ editor }: { editor: TipTapEditor.Editor }) {
  return (
    <div className="border border-surface-outline rounded-lg overflow-hidden">
      <TipTapEditor.Root editor={editor}>
        <TipTapEditor.Toolbar editor={editor} noTopBorder />

        <div className="text-content-accent relative border-b border-stroke-base p-2" style={{ minHeight: "160px" }}>
          <TipTapEditor.EditorContent editor={editor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}

interface Form {
  submit: () => void;
  submitting: boolean;
  timeframe: Timeframes.Timeframe;
  setTimeframe: (timeframe: Timeframes.Timeframe) => void;

  commentEditor: TipTapEditor.EditorState;
}

function useForm({ goal }): Form {
  const [timeframe, setTimeframe] = React.useState<Timeframes.Timeframe>(Timeframes.parse(goal.timeframe));

  const navigateToGoalPage = useNavigateTo(Paths.goalPath(goal.id));
  const [editTimeframe, { loading: submitting }] = Goals.useEditGoalTimeframeMutation({
    onCompleted: navigateToGoalPage,
  });

  const peopleSearch = People.usePeopleSearch();
  const commentEditor = TipTapEditor.useEditor({
    peopleSearch: peopleSearch,
    placeholder: "Write a comment to explain the change...",
  });

  async function submit() {
    await editTimeframe({
      variables: {
        input: {
          id: goal.id,
          timeframe: Timeframes.serialize(timeframe),
        },
      },
    });
  }

  return {
    submit,
    submitting,
    timeframe,
    setTimeframe,
    commentEditor,
  };
}
