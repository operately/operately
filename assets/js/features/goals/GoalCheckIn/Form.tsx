import * as React from "react";
import * as People from "@/models/people";
import * as Goals from "@/models/goals";
import * as Popover from "@radix-ui/react-popover";
import * as Timeframes from "@/utils/timeframes";

import Forms from "@/components/Forms";
import RichContent from "@/components/RichContent";
import { SecondaryButton } from "@/components/Buttons";
import { Chronometer } from "@/components/Chronometer";
import { CustomRangePicker } from "@/components/TimeframeSelector/CustomRangePicker";
import classNames from "classnames";
import { ProgressBar } from "@/components/charts";

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

      <div className="grid grid-cols-2 gap-4">
        {targets.map((target, index) => (
          <TargetCard key={index} index={index} target={target} readonly={readonly} />
        ))}
      </div>
    </div>
  );
}

function TargetCard({ index, target, readonly }: { index: number; target: Goals.Target; readonly: boolean }) {
  const progress = Goals.targetProgressPercentage(target);

  const [_, setFieldValue] = Forms.useFieldValue<Goals.Target>(`targets[${index}]`);

  const updateValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFieldValue({ ...target, value: e.target.value });
  };

  return (
    <div className="border border-surface-outline rounded-lg overflow-hidden h-full p-4 flex flex-col justify-between">
      <div>
        <div className="font-medium leading-tight">{target.name}</div>
      </div>

      <div>
        {readonly ? (
          <div>
            <div className="border-t border-surface-outline mt-2 w-12" />
            <div className="flex items-end justify-between mt-6 mb-2">
              <div className="text-xl font-bold text-gray-800">
                {target.value} {target.unit}
              </div>
              <div className="text-xs">
                +2 <span className="text-accent-1 font-semibold">(-10.2%)</span>
              </div>
            </div>
            <ProgressBar
              percentage={progress}
              width="w-full"
              height="h-2"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />

            <div className="flex items-center justify-between mt-1">
              <div className="text-[10px] text-gray-500">
                {target.from} {target.unit}
              </div>
              <div className="text-[10px] text-gray-500">
                {target.to} {target.unit}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 bg-surface-dimmed -mx-4 px-4 py-4 border-y border-stroke-base">
            <div className="text-xs mb-0.5 font-medium uppercase">Current Value</div>
            <div className="border border-surface-outline rounded-lg">
              <input
                type="text"
                onChange={updateValue}
                value={target.value!}
                className="border-none ring-0 outline-none p-2 rounded-lg w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
