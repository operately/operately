import * as React from "react";
import * as People from "@/models/people";
import * as Popover from "@radix-ui/react-popover";
import * as Timeframes from "@/utils/timeframes";
import * as Goals from "@/models/goals";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import Forms from "@/components/Forms";
import { SecondaryButton } from "@/components/Buttons";
import RichContent from "@/components/RichContent";
import { Chronometer } from "@/components/Chronometer";
import { CustomRangePicker } from "@/components/TimeframeSelector/CustomRangePicker";
import classNames from "classnames";
import { compareIds } from "@/routes/paths";
import { ProgressBar } from "@/components/charts";

interface Props {
  form: any;
  readonly: boolean;
  goal: Goals.Goal;
  children: React.ReactNode;
}

export function Form({ form, readonly, goal, children }: Props) {
  return (
    <Forms.Form form={form}>
      <StatusAndTimeframe readonly={readonly} goal={goal} />
      <Targets readonly={readonly} goal={goal} />
      <Description readonly={readonly} goal={goal} />

      {children}
    </Forms.Form>
  );
}

function StatusAndTimeframe({ readonly, goal }: { readonly: boolean; goal: Goals.Goal }) {
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

function StatusSelector({ readonly, goal }: { readonly: boolean; goal: Goals.Goal }) {
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

function Description({ readonly, goal }: { readonly: boolean; goal: Goals.Goal }) {
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

function DescriptionEditMode({ goal }: { goal: Goals.Goal }) {
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

function Targets({ readonly, goal }: { readonly: boolean; goal: Goals.Goal }) {
  return (
    <div className="mt-8">
      <p className="text-lg font-bold mb-2">Targets</p>

      <div className="grid lg:grid-cols-2 gap-4">
        {goal.targets!.map((target) => (
          <TargetCard readonly={readonly} target={target} />
        ))}

        <TargetCard2 readonly={readonly} />
      </div>
    </div>
  );
}

function TargetCard({ readonly, target }: { readonly: boolean; target: Goals.Target }) {
  const [value] = Forms.useFieldValue<Goals.Target[]>("targets");
  const currTarget = value.find((t: Goals.Target) => compareIds(t.id, target.id))!;

  return (
    <div className="border border-surface-outline rounded-lg overflow-hidden h-full">
      <div className="bg-stone-100 p-4">
        <div className="font-medium leading-tight">{target.name}</div>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between mb-2">
          <div className="text-xl font-bold text-gray-800">100M</div>
          <div className="text-xs">
            +7.50 <span className="text-accent-1 font-semibold">(+1.2%)</span>
          </div>
        </div>

        <ProgressBar percentage={20} width="w-full" height="h-2" rounded={false} bgColor="var(--color-stroke-base)" />

        <div className="flex items-center justify-between mt-1">
          <div className="text-[10px] text-gray-500">30M</div>
          <div className="text-[10px] text-gray-500">250M</div>
        </div>
      </div>
    </div>
  );
}

function TargetCard2({ readonly, target }: { readonly: boolean; target: Goals.Target }) {
  return (
    <div className="border border-surface-outline rounded-lg overflow-hidden h-full p-4">
      <div className="font-medium leading-tight">Reduce infrastructure costs</div>
      <div className="border-t border-surface-outline mt-2 w-12" />

      <div className="flex items-end justify-between mt-6 mb-2">
        <div className="text-xl font-bold text-gray-800">$200M</div>
        <div className="text-xs">
          +2 <span className="text-accent-1 font-semibold">(-10.2%)</span>
        </div>
      </div>

      <ProgressBar percentage={20} width="w-full" height="h-2" rounded={false} bgColor="var(--color-stroke-base)" />

      <div className="flex items-center justify-between mt-1">
        <div className="text-[10px] text-gray-500">$300M</div>
        <div className="text-[10px] text-gray-500">$100M</div>
      </div>
    </div>
  );
}

function TargetValues({ target }: { target: Goals.Target }) {
  return (
    <div className="bg-stone-50 flex flex-col items-center justify-center py-2 border-r border-surface-outline relative shrink-0">
      <div className="relative flex items-center justify-center"></div>
    </div>
  );
}

function TargetProgress({ target }: { target: Goals.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return (
    <div
      className="top-0 left-0 bottom-0 width-10 bg-green-300 absolute"
      style={{ height: "100px", width: progress + "%" }}
    />
  );
}

function TargetEditButton({ target, readonly }: { target: Goals.Target; readonly: boolean }) {
  const [isOpen, setOpen] = React.useState(false);

  if (readonly) return null;

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setOpen}>
      <DropdownMenu.Trigger>
        <SecondaryButton size="xs">Edit</SecondaryButton>
      </DropdownMenu.Trigger>

      <PopupContent target={target} close={() => setOpen(false)} />
    </DropdownMenu.Root>
  );
}

function PopupContent({ target, close }: { target: Goals.Target; close: () => void }) {
  const [value, setValue] = Forms.useFieldValue<Goals.Target[]>("targets");

  const menuContentClass = classNames(
    "relative rounded-md mt-1 z-10 px-1 py-1.5",
    "shadow-xl ring-1 transition ring-surface-outline",
    "focus:outline-none",
    "bg-surface-base",
    "animateMenuSlideDown",
  );

  const form = Forms.useForm({
    fields: {
      value: value.find((t: Goals.Target) => compareIds(t.id, target.id))?.value,
    },
    cancel: close,
    submit: () => {
      const newTargets = value.map((t) => {
        if (compareIds(t.id, target.id)) {
          return { ...t, value: form.values.value };
        }
        return t;
      });

      setValue(newTargets);
      close();
    },
  });

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content className={menuContentClass} align="end" sideOffset={25}>
        <div className="w-96 p-4">
          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <Forms.NumberInput field={"value"} label="New value" autoFocus />
            </Forms.FieldGroup>

            <Forms.Submit saveText="Update" cancelText="Dismiss" />
          </Forms.Form>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}
