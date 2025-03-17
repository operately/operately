import * as React from "react";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Popover from "@radix-ui/react-popover";
import * as Timeframes from "@/utils/timeframes";
import * as Icons from "@tabler/icons-react";

import { SecondaryButton } from "@/components/Buttons";
import { Chronometer } from "@/components/Chronometer";
import { CustomRangePicker } from "@/components/TimeframeSelector/CustomRangePicker";
import { MiniPieChart } from "@/components/charts";
import { isPresent } from "@/utils/isPresent";

import Forms from "@/components/Forms";
import RichContent from "@/components/RichContent";
import classNames from "classnames";
import { match } from "ts-pattern";
import { durationHumanized } from "@/utils/time";

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
      The goal is <span className="bg-stone-300">Pending</span>. Work has not started yet.
      <br />
    </span>
  );
}

function OverviewOnTrack() {
  return (
    <span>
      The goal is <mark data-highlight="bgGreen">on-track</mark>.
    </span>
  );
}

function OverviewConcern({ goal }: { goal: Goals.Goal }) {
  return (
    <span>
      <mark data-highlight="bgYellow">Concern</mark>. There are risks.
      {goal.reviewer && <span> {People.firstName(goal.reviewer)} should be aware.</span>}
      <br />
    </span>
  );
}

function OverviewIssue({ goal }: { goal: Goals.Goal }) {
  return (
    <span>
      <mark data-highlight="bgRed">Issue</mark>. The goal is blocked or significantly behind.{" "}
      {goal.reviewer && <span> {People.firstName(goal.reviewer)}'s help is needed.</span>}
      <br />
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
    return <span>{durationHumanized(new Date(), timeframe.endDate)} left to complete the goal.</span>;
  }
}

function StatusAndTimeframeForm({ goal }: { goal: Goals.Goal }) {
  return (
    <Forms.FieldGroup>
      <div className="flex items-start gap-8">
        <StatusSelector goal={goal} />
        <TimeframeSelector />
      </div>
    </Forms.FieldGroup>
  );
}

function StatusSelector({ goal }: { goal: Goals.Goal }) {
  const noReviewer = !goal.reviewer;
  const reviewerName = goal.reviewer ? People.firstName(goal.reviewer) : "";

  return (
    <div>
      <Label text="Status" />
      <Forms.SelectGoalStatus field="status" reviewerFirstName={reviewerName} noReviewer={noReviewer} />
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

      <Chronometer start={value.startDate!} end={value.endDate!} />
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
    "flex flex-col items-start p-4",
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <SecondaryButton size="xxs">Edit</SecondaryButton>
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
  const [targets] = Forms.useFieldValue<Goals.Target[]>("targets");

  return (
    <div>
      <Label text={readonly ? "Targets" : "Update targets"} />

      <div>
        {targets.map((target, index) => (
          <TargetCard key={index} index={index} target={target} readonly={readonly} />
        ))}
      </div>
    </div>
  );
}

function TargetCard({ readonly, target, index }: { index: number; target: GoalCheckIns.Target; readonly: boolean }) {
  return (
    <details className="border-t last:border-b border-stroke-base py-2 px-px">
      <summary className="flex justify-between items-center cursor-pointer">
        <div className="flex items-center gap-2 flex-1">
          <TargetPieChart target={target} />
          <TargetName target={target} />
        </div>

        {readonly ? <TargetValue target={target} /> : <TargetInput target={target} index={index} />}
        <Icons.IconChevronDown className="ml-2" size={14} />
      </summary>

      <TargetDetails target={target} />
    </details>
  );
}

function TargetValue({ target }: { target: GoalCheckIns.Target }) {
  return (
    <>
      <div className="py-1 w-32 text-right text-sm">
        <span className="font-extrabold">{target.value}</span>
        {target.unit === "%" ? "%" : ` ${target.unit}`}
      </div>
      <TargetValueDiff target={target} />
    </>
  );
}

function TargetPieChart({ target }: { target: GoalCheckIns.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return <MiniPieChart completed={progress} total={100} size={16} />;
}

function TargetDetails({ target }: { target: GoalCheckIns.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return (
    <div className="text-sm ml-6 rounded-lg my-2">
      <div className="flex items-center gap-2">
        <div className="w-20 font-semibold">Target</div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            From <span className="font-semibold">{target.from}</span> {target.from! > target.to! ? "down to" : "to"}{" "}
            <span className="font-semibold">{target.to}</span>
            {target.unit === "%" ? "%" : ` ${target.unit}`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-20 font-semibold">Current</div>
        <div className="">
          {target.value} {target.unit} ({progress.toFixed(1)}%)
        </div>
      </div>
    </div>
  );
}

function TargetInput({ index }: { target: Goals.Target; index: number }) {
  const [value, setValue] = Forms.useFieldValue<number | null>(`targets[${index}].value`);
  const [tempValue, setTempValue] = React.useState<string>(value?.toString() || "");
  const error = Forms.useFieldError(`targets[${index}].value`);

  const onBlur = () => {
    const parsedValue = parseFloat(tempValue);

    if (isNaN(parsedValue)) {
      setTempValue(value?.toString() || "");
    } else {
      setValue(parsedValue);
      setTempValue(parsedValue.toString());
    }
  };

  return (
    <div className="">
      <div>
        <input
          type="text"
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={onBlur}
          value={tempValue || ""}
          className="ring-0 outline-none px-2 py-1.5 text-sm font-medium w-32 text-right border border-stroke-base rounded"
        />
      </div>

      {error && <div className="text-xs text-content-error mt-0.5">{error}</div>}
    </div>
  );
}

function TargetName({ target }: { target: GoalCheckIns.Target }) {
  return <div className="font-medium truncate flex-1">{target.name}</div>;
}

function TargetValueDiff({ target }: { target: GoalCheckIns.Target }) {
  if (!isPresent(target.value)) return null;
  if (!isPresent(target.previousValue)) return null;

  const diff = target.value - target.previousValue;
  if (diff === 0) return null;

  const sentiment = GoalCheckIns.targetChangeSentiment(target);
  const diffText = `${Math.abs(diff)}`;
  const diffSign = diff > 0 ? "+" : "-";
  const color = sentiment === "positive" ? "text-green-600" : "text-content-error";

  return (
    <div className={"text-xs ml-2 font-mono font-bold" + " " + color}>
      {diffSign}
      {diffText}
    </div>
  );
}
