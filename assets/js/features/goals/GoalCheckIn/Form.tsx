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
import { MiniPieChart, PieChart, ProgressBar } from "@/components/charts";
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
        <StatusAndTimeframe goal={goal} readonly={readonly} />
        <Targets readonly={readonly} />
        <Description goal={goal} readonly={readonly} />
      </div>

      {children}
    </Forms.Form>
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
  return <div className={"text-lg font-bold mb-2 " + className}>{text}</div>;
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

      <div>
        {targets.map((target, index) =>
          readonly ? (
            <TargetCard key={index} index={index} target={target} readonly={readonly} />
          ) : (
            <TargetInput key={index} index={index} target={target} />
          ),
        )}
      </div>
    </div>
  );
}

function TargetCard({ target }: { index: number; target: GoalCheckIns.Target; readonly: boolean }) {
  const progress = Goals.targetProgressPercentage(target);
  const sentiment = GoalCheckIns.targetChangeSentiment(target);

  return (
    <details className="border-t last:border-b border-stroke-base py-2 px-px">
      <summary className="flex justify-between items-center cursor-pointer">
        <div className="flex items-center gap-2 flex-1">
          <MiniPieChart completed={progress} total={100} size={16} />
          <TargetName target={target} />
        </div>
        <div className="text-xs flex items-center gap-1 ml-4 w-12 flex-row-reverse">
          0.3%
          {sentiment === "positive" && <Icons.IconArrowUp size={14} className="text-green-600" />}
          {sentiment === "negative" && <Icons.IconArrowDown size={14} className="text-red-600" />}
        </div>
        <div className="py-1 w-32 text-right text-sm">
          <span className="font-extrabold">{target.value}</span>
          {target.unit === "%" ? "%" : ` ${target.unit}`}
        </div>
        <Icons.IconChevronDown className="ml-2" size={14} />
      </summary>

      <div className="text-sm ml-6 rounded-lg my-2">
        <div className="flex items-center gap-2">
          <div className="w-16 text-stone-800">Target</div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              From <span className="font-semibold">{target.from}</span>{" "}
              {target.from! > target.to! ? "down to" : "up to"} <span className="font-semibold">{target.to}</span>
              {target.unit === "%" ? "%" : ` ${target.unit}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="w-16 text-stone-800">Progress</div>
          <div className="">{progress.toFixed(1)}%</div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="w-16 text-stone-800">Current</div>
          <div className="">
            {target.value} {target.unit}
          </div>
        </div>
      </div>
    </details>
  );
}

function TargetInput({ target, index }: { target: Goals.Target; index: number }) {
  const [value, setValue] = Forms.useFieldValue<number | null>(`targets[${index}].value`);
  const [tempValue, setTempValue] = React.useState<string>(value?.toString() || "");
  const error = Forms.useFieldError(`targets[${index}].value`);
  const progress = Goals.targetProgressPercentage(target);

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
    <details className="border-t last:border-b border-stroke-base py-2 px-px">
      <summary className="flex justify-between items-center cursor-pointer">
        <div className="flex items-center gap-2 flex-1">
          <MiniPieChart completed={progress} total={100} size={16} />
          <TargetName target={target} />
        </div>

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

        <Icons.IconChevronDown className="ml-2" size={14} />
      </summary>

      <div className="text-sm ml-6 rounded-lg my-2">
        <div className="flex items-center gap-2">
          <div className="w-16 text-stone-800">Target</div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              From <span className="font-semibold">{target.from}</span>{" "}
              {target.from! > target.to! ? "down to" : "up to"} <span className="font-semibold">{target.to}</span>
              {target.unit === "%" ? "%" : ` ${target.unit}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="w-16 text-stone-800">Progress</div>
          <div className="">{progress.toFixed(1)}%</div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="w-16 text-stone-800">Current</div>
          <div className="">
            {target.value} {target.unit}
          </div>
        </div>
      </div>
    </details>
  );
}

function TargetName({ target }: { target: GoalCheckIns.Target }) {
  return <div className="font-medium truncate flex-1">{target.name}</div>;
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
