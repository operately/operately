import * as React from "react";
import * as People from "@/models/people";
import * as Popover from "@radix-ui/react-popover";
import * as Timeframes from "@/utils/timeframes";

import Forms from "@/components/Forms";
import { Goal } from "@/models/goals";
import { SecondaryButton } from "@/components/Buttons";
import RichContent from "@/components/RichContent";
import { Chronometer } from "@/components/Chronometer";
import { CustomRangePicker } from "@/components/TimeframeSelector/CustomRangePicker";
import classNames from "classnames";

interface Props {
  form: any;
  readonly: boolean;
  goal: Goal;
  children: React.ReactNode;
}

export function Form({ form, readonly, goal, children }: Props) {
  return (
    <Forms.Form form={form}>
      <StatusAndTimeframe goal={goal} readonly={readonly} />
      <Targets />
      <Description readonly={readonly} goal={goal} />

      {children}
    </Forms.Form>
  );
}

function StatusAndTimeframe({ readonly, goal }: { readonly: boolean; goal: Goal }) {
  if (readonly) return null;

  return (
    <div className="flex items-start gap-8 mt-8">
      <StatusSelector readonly={readonly} goal={goal} />
      <TimeframeSelector readonly={readonly} />
    </div>
  );
}

function TimeframeSelector({ readonly }: { readonly: boolean }) {
  if (readonly) return null;

  const [open, setOpen] = React.useState(false);
  const [value] = Forms.useFieldValue<Timeframes.Timeframe>("timeframe");

  return (
    <div className="">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-lg font-bold">Timeframe</p>

        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger>
            <SecondaryButton size="xxs">Edit</SecondaryButton>
          </Popover.Trigger>
          <TimeframePopoverContent field="timeframe" />
        </Popover.Root>
      </div>

      <Chronometer start={value.startDate!} end={value.endDate!} />
    </div>
  );
}

function TimeframePopoverContent({ field }: { field: string }) {
  const [value, setValue] = Forms.useFieldValue<Timeframes.Timeframe>(field);

  const className = classNames(
    "z-[100] overflow-hidden",
    "border border-surface-outline",
    "rounded-lg shadow-xl",
    "bg-surface-base",
    "flex flex-col items-start p-6",
  );

  return (
    <Popover.Portal>
      <Popover.Content className={className} align="center" sideOffset={50}>
        <CustomRangePicker timeframe={value} setTimeframe={setValue} />
      </Popover.Content>
    </Popover.Portal>
  );
}

function StatusSelector({ readonly, goal }: { readonly: boolean; goal: Goal }) {
  if (readonly) return null;

  const reviewerFirstName = goal.reviewer ? People.firstName(goal.reviewer) : "Reviewer";

  return (
    <div className="">
      <p className="text-lg font-bold mb-2">Status</p>

      <Forms.FieldGroup>
        <Forms.SelectGoalStatus field="status" reviewerFirstName={reviewerFirstName} />
      </Forms.FieldGroup>
    </div>
  );
}

function Description({ readonly, goal }: { readonly: boolean; goal: Goal }) {
  const [value, _] = Forms.useFieldValue("description");

  return (
    <div className="mt-8">
      <p className="text-lg font-bold mb-2">Key wins, obstacles and needs</p>
      {readonly ? <DescriptionViewMode value={value} /> : <DescriptionEditMode goal={goal} />}
    </div>
  );
}

function DescriptionViewMode({ value }: { value: string }) {
  return <RichContent jsonContent={JSON.stringify(value)} className="text-lg" />;
}

function DescriptionEditMode({ goal }: { goal: Goal }) {
  const mentionSearchScope = { type: "goal", id: goal.id! } as const;

  return (
    <Forms.FieldGroup>
      <Forms.RichTextArea
        field="description"
        placeholder="Write here..."
        mentionSearchScope={mentionSearchScope}
        required
      />
    </Forms.FieldGroup>
  );
}

function Targets() {
  return (
    <div className="mt-8">
      <p className="text-lg font-bold mb-2">Targets</p>

      <div className="space-y-4">
        {/* First Target */}
        <div className="flex border border-surface-outline rounded-lg overflow-hidden">
          <div className="bg-stone-50 w-32 flex flex-col items-center justify-center py-2 border-r border-surface-outline relative">
            <div
              className="top-0 left-0 bottom-0 width-10 bg-green-200 absolute"
              style={{ height: "100px", width: "30px" }}
            />

            <div className="relative">
              <div className="text-xl font-bold text-gray-800 text-center">$ 10M</div>
              <div className="text-xs text-gray-500">Target: $ 20M</div>
            </div>
          </div>

          <div className="flex-1 p-4 flex items-center gap-4 justify-between">
            <div className="h-full flex flex-col justify-center">
              <div className="font-medium">Achieve month-over-month growth in new user signups</div>
            </div>

            <SecondaryButton size="xs" onClick={() => {}}>
              Edit
            </SecondaryButton>
          </div>
        </div>

        {/* First Target */}
        <div className="flex border border-surface-outline rounded-lg overflow-hidden">
          <div className="bg-stone-50 w-32 flex flex-col items-center justify-center py-2 border-r border-surface-outline relative">
            <div
              className="top-0 left-0 bottom-0 width-10 bg-green-200 absolute"
              style={{ height: "100px", width: "100px" }}
            />

            <div className="relative">
              <div className="text-sm font-bold text-gray-800 text-center">DONE</div>
            </div>
          </div>

          <div className="flex-1 p-4 flex items-center gap-4 justify-between">
            <div className="h-full flex flex-col justify-center">
              <div className="font-medium">Ensure 90% of new users are retained after 30 days</div>
            </div>

            <SecondaryButton size="xs" onClick={() => {}}>
              Edit
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
