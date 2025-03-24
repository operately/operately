import * as React from "react";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";
import * as Popover from "@radix-ui/react-popover";
import * as Timeframes from "@/utils/timeframes";

import { SecondaryButton } from "@/components/Buttons";
import { Chronometer } from "@/components/Chronometer";
import { CustomRangePicker } from "@/components/TimeframeSelector/CustomRangePicker";

import Forms from "@/components/Forms";
import RichContent from "@/components/RichContent";
import classNames from "classnames";
import { match } from "ts-pattern";
import { durationHumanized } from "@/utils/time";
import { GoalTargetsField } from "@/features/goals/GoalTargetsV2";
import { StatusSelector } from "./StatusSelector";

interface Props {
  form: any;
  readonly: boolean;
  goal: Goals.Goal;
  children?: React.ReactNode;
}

export function Form({ form, readonly, goal, children }: Props) {
  return (
    <Forms.Form form={form} preventSubmitOnEnter>
      <div className="space-y-8 mt-8">
        <StatusAndTimeframe goal={goal} readonly={readonly} />
        <Targets readonly={readonly} />
        <Description goal={goal} readonly={readonly} />
      </div>

      {children}
    </Forms.Form>
  );
}

function StatusAndTimeframe({ goal, readonly }: { goal: Goals.Goal; readonly: boolean }) {
  if (readonly) {
    return <TextualOverview goal={goal} />;
  } else {
    return <StatusAndTimeframeForm goal={goal} />;
  }
}

function TextualOverview({ goal }: { goal: Goals.Goal }) {
  return (
    <div className="ProseMirror">
      <Label text="Overview" />
      <OverviewStatus goal={goal} /> <OverviewTimeframe />
    </div>
  );
}

function OverviewStatus({ goal }: { goal: Goals.Goal }) {
  const [value] = Forms.useFieldValue("status");

  return match(value)
    .with("pending", () => <OverviewPending />)
    .with("on_track", () => <OverviewOnTrack />)
    .with("concern", () => <OverviewConcern goal={goal} />)
    .with("caution", () => <OverviewConcern goal={goal} />)
    .with("issue", () => <OverviewIssue goal={goal} />)
    .run();
}

function OverviewPending() {
  return (
    <span>
      The goal is <span className="bg-stone-300 dark:bg-stone-600">pending</span>. Work has not started yet.
    </span>
  );
}

function OverviewOnTrack() {
  return (
    <span>
      The goal is <mark data-highlight="bgGreen">on track</mark> and progressing well with no blockers.
    </span>
  );
}

function OverviewConcern({ goal }: { goal: Goals.Goal }) {
  return (
    <span>
      The goal <mark data-highlight="bgYellow">needs attention</mark>, due to emerging risks.
      {goal.reviewer && <span> {People.firstName(goal.reviewer)} should be aware of these concerns.</span>}
    </span>
  );
}

function OverviewIssue({ goal }: { goal: Goals.Goal }) {
  return (
    <span>
      The goal is <mark data-highlight="bgRed">at risk</mark> due to blockers or significant delays.
      {goal.reviewer && <span> {People.firstName(goal.reviewer)}'s help is needed.</span>}
    </span>
  );
}

function OverviewTimeframe() {
  const [timeframe] = Forms.useFieldValue<Timeframes.Timeframe>("timeframe");
  if (!timeframe.endDate) return null;

  if (timeframe.endDate < new Date()) {
    return (
      <span>
        {durationHumanized(timeframe.endDate, new Date())} <mark data-highlight="bgRed">overdue</mark>.
      </span>
    );
  } else {
    return <span>{durationHumanized(new Date(), timeframe.endDate)} remaining until the deadline.</span>;
  }
}

function StatusAndTimeframeForm({ goal }: { goal: Goals.Goal }) {
  return (
    <Forms.FieldGroup>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:w-3/4">
        <GoalStatusSelector goal={goal} />
        <TimeframeSelector />
      </div>
    </Forms.FieldGroup>
  );
}

function GoalStatusSelector({ goal }: { goal: Goals.Goal }) {
  const noReviewer = !goal.reviewer;
  const reviewerName = goal.reviewer ? People.firstName(goal.reviewer) : "";

  return (
    <div>
      <Label text="Status" />
      <StatusSelector field="status" reviewerFirstName={reviewerName} noReviewer={noReviewer} />
    </div>
  );
}

function Description({ goal, readonly }: { goal: Goals.Goal; readonly: boolean }) {
  if (readonly) {
    return <DescriptionView />;
  } else {
    return <DescriptionEdit goal={goal} />;
  }
}

function DescriptionView() {
  const [value] = Forms.useFieldValue("description");

  return (
    <div>
      <Label text="Key wins, obstacles and needs" />
      <RichContent jsonContent={value} skipParse />
    </div>
  );
}

function DescriptionEdit({ goal }: { goal: Goals.Goal }) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <div>
      <Label text="Describe key wins, obstacles and needs" />
      <Forms.FieldGroup>
        <Forms.RichTextArea
          field="description"
          placeholder="Write here..."
          mentionSearchScope={mentionSearchScope}
          required
        />
      </Forms.FieldGroup>
    </div>
  );
}

function Label({ text, className = "" }: { text: string; className?: string }) {
  return <div className={"font-bold mb-1.5 " + className}>{text}</div>;
}

function TimeframeSelector() {
  const [value, setValue] = Forms.useFieldValue<Timeframes.Timeframe>("timeframe");

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Label text="Timeframe" className="mb-0" />
        <TimeframeEditButton value={value} setValue={setValue} />
      </div>

      <Chronometer start={value.startDate!} end={value.endDate!} width="w-full" />
    </div>
  );
}

interface TimeframeEditButtonProps {
  value: Timeframes.Timeframe;
  setValue: (value: Timeframes.Timeframe) => void;
}

function TimeframeEditButton({ value, setValue }: TimeframeEditButtonProps) {
  const [open, setOpen] = React.useState(false);

  const contentClassName = classNames(
    "z-[100] overflow-hidden",
    "border border-surface-outline",
    "rounded-lg shadow-xl",
    "bg-surface-base",
    "max-w-[100vw]",
    "p-4",
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <SecondaryButton size="xxs" spanButton>
          Edit
        </SecondaryButton>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={contentClassName} align="center" sideOffset={50}>
          <CustomRangePicker timeframe={value} setTimeframe={setValue} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Targets({ readonly }: { readonly: boolean }) {
  return (
    <div>
      <Label text={readonly ? "Targets" : "Update targets"} />
      <GoalTargetsField field="targets" readonly={readonly} />
    </div>
  );
}
