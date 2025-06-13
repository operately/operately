import * as TipTapEditor from "@/components/Editor";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";
import * as Timeframes from "@/utils/timeframes";
import * as React from "react";

import { Datepicker } from "@/components/Datepicker";
import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { SubscribersSelector, SubscriptionsState } from "@/features/Subscriptions";
import { PageModule } from "@/routes/types";
import { assertPresent } from "@/utils/assertions";
import { DimmedLink, PrimaryButton } from "turboui";
import { Form, useForm } from "./useForm";

import { usePaths } from "@/routes/paths";
export default { name: "GoalEditTimeframePage", loader, Page } as PageModule;

interface LoaderResult {
  goal: Goals.Goal;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.goalId,
      includeChampion: true,
      includeReviewer: true,
      includeSpace: true,
      includePotentialSubscribers: true,
    }).then((data) => data.goal!),
  };
}

function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();
  const form = useForm({ goal });

  return (
    <Pages.Page title={["Edit Timeframe", goal.name!]}>
      <Paper.Root size="small">
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body minHeight="300px">
          <Title />
          <Subtitle goal={goal} />
          <TimeframeInputs form={form} />
          <Comments form={form} />
          <Subscribers goal={goal} subscriptionsState={form.subscriptionsState} />
          <Submit goal={goal} form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  const paths = usePaths();
  return <div className="text-content-accent text-2xl font-extrabold">Editing the Goal's Timeframe</div>;
}

function Subtitle({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="mb-8">
      <div className="text-content-accent">
        Current timeframe: {Timeframes.format(Timeframes.parse(goal.timeframe!))}
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
        <p className="font-bold mb-1">Due Date</p>
        <Datepicker
          date={form.timeframe.endDate!}
          setDate={(date) => form.setTimeframe({ ...form.timeframe, endDate: date, type: "days" })}
        />

        <div className="mt-2 flex items-center gap-1.5">
          <DimmedButton onClick={decreaseEndByOneMonth} testId="end-date-minus-1-month">
            -1 month
          </DimmedButton>
          <DimmedButton onClick={increaseEndByOneMonth} testId="end-date-plus-1-month">
            +1 month
          </DimmedButton>
        </div>
      </div>
    </div>
  );
}

function DimmedButton({
  onClick,
  children,
  testId,
}: {
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="rounded-lg bg-surface-dimmed p-2 py-0.5 text-xs hover:bg-surface-highlight cursor-pointer"
      onClick={onClick}
      data-test-id={testId}
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
  const paths = usePaths();
  return (
    <div className="mt-6">
      <Error form={form} />

      <div className="flex items-center gap-4">
        <PrimaryButton onClick={form.submit} loading={form.submitting} size="base" testId="submit">
          Submit
        </PrimaryButton>

        <DimmedLink to={paths.goalPath(goal.id!)}>Cancel</DimmedLink>
      </div>
    </div>
  );
}

function Error({ form }: { form: Form }) {
  if (!form.error) return null;

  return <div className="mb-2 text-content-error font-medium">{form.error.message}</div>;
}

function Subscribers({ goal, subscriptionsState }: { goal: Goals.Goal; subscriptionsState: SubscriptionsState }) {
  assertPresent(goal.space, "space must be present in goal");

  return (
    <div className="my-10">
      <SubscribersSelector state={subscriptionsState} spaceName={goal.space.name} />
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
