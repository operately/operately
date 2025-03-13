import * as React from "react";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Popover from "@radix-ui/react-popover";
import * as Timeframes from "@/utils/timeframes";
import * as Icons from "@tabler/icons-react";

import Forms from "@/components/Forms";
import RichContent from "@/components/RichContent";
import { SecondaryButton } from "@/components/Buttons";
import { Chronometer } from "@/components/Chronometer";
import { CustomRangePicker } from "@/components/TimeframeSelector/CustomRangePicker";
import classNames from "classnames";
import { PieChart, ProgressBar } from "@/components/charts";
import { isPresent } from "@/utils/isPresent";

interface Props {
  form: any;
  readonly: boolean;
  goal: Goals.Goal;
  children?: React.ReactNode;
}

export function Form({ form, readonly, goal, children }: Props) {
  return (
    <Forms.Form form={form} preventSubmitOnEnter>
      <div className="space-y-6 mt-6">
        <div>
          <Label text="Overview" />
          <div>Status is On Track. 6 months left to achieve the goal.</div>
        </div>
        <StatusAndTimeframe goal={goal} readonly={readonly} />
        <Targets2 readonly={readonly} />
        <Description goal={goal} readonly={readonly} />
      </div>

      {children}
    </Forms.Form>
  );
}

function Targets2({ readonly }: { readonly: boolean }) {
  const [targets] = Forms.useFieldValue<Goals.Target[]>("targets");

  return (
    <div>
      <Label text={readonly ? "Targets" : "Update targets"} />

      <div>
        <div className="py-3 flex items-center gap-2 justify-between border-t border-stroke-base">
          <div>Achieve 1000+ active users in new countries</div>
          <div className="flex items-center">
            <span className="text-accent-1 font-semibold shink-0">700 users</span>{" "}
            <Icons.IconChevronDown size={14} className="ml-4" />
          </div>
        </div>

        <div className="py-3 flex items-center gap-2 justify-between border-y border-stroke-base">
          <div>Expand to new countries</div>

          <div className="flex items-center gap-4">
            700 countries
            <Icons.IconChevronDown size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusAndTimeframe({ goal, readonly }: { goal: Goals.Goal; readonly: boolean }) {
  if (readonly) return null;

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
  return <div className={"font-bold mb-2 " + className}>{text}</div>;
}

function TimeframeSelector() {
  const [value, setValue] = Forms.useFieldValue<Timeframes.Timeframe>("timeframe");

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
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

      <div className="grid grid-cols-2 gap-4">
        {targets.map((target, index) => (
          <TargetCard key={index} index={index} target={target} readonly={readonly} />
        ))}
      </div>
    </div>
  );
}

const targetCardClassName = classNames(
  "border border-surface-outline",
  "rounded-lg",
  "overflow-hidden",
  "p-4",
  "h-full", // Fill the height of the grid cell
  "flex flex-col justify-between",
);

function TargetCard({ index, target, readonly }: { index: number; target: GoalCheckIns.Target; readonly: boolean }) {
  return (
    <div className={targetCardClassName}>
      <TargetName target={target} />
      {readonly ? <TargetValueAndDiff target={target} /> : <TargetInput target={target} index={index} />}
      <TargetProgressBar target={target} />
    </div>
  );
}

function TargetValueAndDiff({ target }: { target: GoalCheckIns.Target }) {
  return (
    <div>
      <div className="border-t border-surface-outline mt-2 w-12" />
      <div className="flex items-end justify-between mt-4 mb-2">
        <div className="text-xl font-bold text-gray-800 mt-2">
          {target.value} {target.unit}
        </div>
        <TargetValueDiff target={target} />
      </div>
    </div>
  );
}

function TargetInput({ index }: { target: Goals.Target; index: number }) {
  const [value, setValue] = Forms.useFieldValue<number | null>(`targets[${index}].value`);
  const [tempValue, setTempValue] = React.useState<string>(value?.toString() || "");
  const error = Forms.useFieldError(`targets[${index}].value`);

  const className = classNames("border", {
    "border-surface-outline": !error,
    "border-content-error": error,
  });

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
    <div className="mb-3 mt-4">
      <div className={className}>
        <input
          type="text"
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={onBlur}
          value={tempValue || ""}
          className="border-none ring-0 outline-none p-2 text-sm font-medium w-full text-right"
        />
      </div>

      {error && <div className="text-xs text-content-error mt-0.5">{error}</div>}
    </div>
  );
}

function TargetName({ target }: { target: GoalCheckIns.Target }) {
  return <div className="font-medium leading-tight">{target.name}</div>;
}

function TargetProgressBar({ target }: { target: GoalCheckIns.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return (
    <div>
      <ProgressBar
        percentage={progress}
        width="w-full"
        height="h-2"
        rounded={false}
        bgColor="var(--color-stroke-base)"
      />

      <div className="flex items-center justify-between mt-1">
        <div className="text-xs text-gray-500">
          {target.from} {target.unit}
        </div>
        <div className="text-xs text-gray-500">
          {target.to} {target.unit}
        </div>
      </div>
    </div>
  );
}

function TargetValueDiff({ target }: { target: GoalCheckIns.Target }) {
  if (!isPresent(target.value)) return null;
  if (!isPresent(target.previousValue)) return null;

  const diff = target.value - target.previousValue;
  if (diff === 0) return null;

  const diffSign = diff > 0 ? "+" : "-";

  const sentiment = GoalCheckIns.targetChangeSentiment(target);
  const color = sentiment === "positive" ? "text-green-600" : "text-content-error";

  const percentage = (diff / target.previousValue) * 100;
  const percentageClassName = `${color} font-semibold`;

  const diffText = `${diffSign}${Math.abs(diff)}`;
  const percentageText = `${diffSign}${Math.abs(percentage).toFixed(0)}%`;

  return (
    <div className="text-xs">
      {diffText} <span className={percentageClassName}>({percentageText})</span>
    </div>
  );
}
