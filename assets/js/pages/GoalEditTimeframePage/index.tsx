import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Paper from "@/components/PaperContainer";
import * as Timeframes from "@/utils/timeframes";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";
import * as Time from "@/utils/time";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { FilledButton } from "@/components/Button";
import { InlinePeopleList } from "@/components/InlinePeopleList";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { Paths } from "@/routes/paths";
import { DimmedLink } from "@/components/Link";
import { Datepicker } from "@/components/Datepicker";

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
          <TimeframeInputs form={form} />
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

function TimeframeInputs({ form }: { form: Form }) {
  const increaseByOneMonth = (date: Date) => {
    if (Time.isLastDayOfMonth(date)) {
      return new Date(date.getFullYear(), date.getMonth() + 2, 0);
    } else if (Time.isFirstDayOfMonth(date)) {
      return new Date(date.getFullYear(), date.getMonth() + 1, 1);
    } else {
      return Time.addDays(date, 30);
    }
  };

  const decreaseByOneMonth = (date: Date) => {
    if (Time.isLastDayOfMonth(date)) {
      return new Date(date.getFullYear(), date.getMonth(), 0);
    } else if (Time.isFirstDayOfMonth(date)) {
      return new Date(date.getFullYear(), date.getMonth() - 1, 1);
    } else {
      return Time.addDays(date, -30);
    }
  };

  const increaseStartByOneMonth = () => {
    form.setTimeframe({
      ...form.timeframe,
      startDate: increaseByOneMonth(form.timeframe.startDate!),
      type: "days",
    });
  };

  const decreaseStartByOneMonth = () => {
    form.setTimeframe({
      ...form.timeframe,
      startDate: decreaseByOneMonth(form.timeframe.startDate!),
      type: "days",
    });
  };

  const increaseEndByOneMonth = () => {
    form.setTimeframe({
      ...form.timeframe,
      endDate: increaseByOneMonth(form.timeframe.endDate!),
      type: "days",
    });
  };

  const decreaseEndByOneMonth = () => {
    form.setTimeframe({
      ...form.timeframe,
      endDate: decreaseByOneMonth(form.timeframe.endDate!),
      type: "days",
    });
  };

  return (
    <div className="mt-8 grid grid-cols-2 gap-6">
      <div>
        <p className="font-bold mb-1">Start Date</p>
        <Datepicker
          date={form.timeframe.startDate!}
          setDate={(date) => form.setTimeframe({ ...form.timeframe, startDate: date, type: "days" })}
        />

        <div className="mt-2 flex items-center gap-1.5">
          <DimmedButton onClick={decreaseStartByOneMonth}>-1 month</DimmedButton>
          <DimmedButton onClick={increaseStartByOneMonth}>+1 month</DimmedButton>
        </div>
      </div>

      <div>
        <p className="font-bold mb-1">Start Date</p>
        <Datepicker
          date={form.timeframe.endDate!}
          setDate={(date) => form.setTimeframe({ ...form.timeframe, endDate: date, type: "days" })}
        />

        <div className="mt-2 flex items-center gap-1.5">
          <DimmedButton onClick={decreaseEndByOneMonth}>-1 month</DimmedButton>
          <DimmedButton onClick={increaseEndByOneMonth}>+1 month</DimmedButton>
        </div>
      </div>
    </div>
  );
}

function DimmedButton({ onClick, children }) {
  return (
    <div
      className="rounded-lg bg-surface-dimmed p-2 py-0.5 text-xs hover:bg-surface-highlight cursor-pointer"
      onClick={onClick}
    >
      {children}
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
    <div className="mt-6">
      <Error form={form} />

      <div className="flex items-center gap-4">
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
    </div>
  );
}

function Error({ form }: { form: Form }) {
  if (!form.error) return null;

  return <div className="mb-2 text-red-500 font-medium">{form.error.message}</div>;
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

interface Error {
  message: string;
}

interface Form {
  submit: () => Promise<boolean>;
  submitting: boolean;
  timeframe: Timeframes.Timeframe;
  setTimeframe: (timeframe: Timeframes.Timeframe) => void;

  commentEditor: TipTapEditor.EditorState;
  error: Error | null;
}

function useForm({ goal }): Form {
  const originalTimeframe = Timeframes.parse(goal.timeframe);
  const [timeframe, setTimeframe] = React.useState<Timeframes.Timeframe>(originalTimeframe);

  const navigateToGoalPage = useNavigateTo(Paths.goalPath(goal.id));
  const [editTimeframe, { loading: submitting }] = Goals.useEditGoalTimeframeMutation({
    onCompleted: navigateToGoalPage,
  });

  const peopleSearch = People.usePeopleSearch();
  const commentEditor = TipTapEditor.useEditor({
    peopleSearch: peopleSearch,
    placeholder: "Explain the reason for the change here...",
  });

  const [error, setError] = React.useState<{ message: string } | null>(null);

  function validate() {
    if (Timeframes.equalDates(timeframe, originalTimeframe)) {
      return { message: "The timeframe has not changed" };
    }

    return null;
  }

  async function submit() {
    const error = validate();
    if (error) {
      setError(error);
      return false;
    }

    await editTimeframe({
      variables: {
        input: {
          id: goal.id,
          timeframe: Timeframes.serialize(timeframe),
        },
      },
    });

    return true;
  }

  return {
    submit,
    submitting,
    timeframe,
    setTimeframe,
    commentEditor,
    error,
  };
}
