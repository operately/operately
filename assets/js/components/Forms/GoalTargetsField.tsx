import React from "react";

import * as Goals from "@/models/goals";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import classNames from "classnames";

import Forms from "@/components/Forms";
import { GhostButton } from "@/components/Buttons";
import { ProgressBar } from "@/components/charts";
import { compareIds } from "@/routes/paths";

import { useFieldValue } from "./FormContext";
import { InputField } from "./FieldGroup";

interface Props {
  field: string;
  label?: string;
}

export function GoalTargetsField({ field, label }: Props) {
  const [targets] = useFieldValue<Goals.Target[]>(field);
  const [targetOpen, setTargetOpen] = React.useState<string>();

  return (
    <InputField field={field} label={label}>
      {targets.map((target) => (
        <TargetField
          field={field}
          target={target}
          currentOpenTarget={targetOpen}
          setTargetOpen={setTargetOpen}
          key={target.id}
        />
      ))}
    </InputField>
  );
}

function findPercentage(target: Goals.Target) {
  const percentage = ((target.value! - target.from!) / (target.to! - target.from!)) * 100;
  return Math.max(0, Math.min(100, percentage));
}

interface TargetFieldProps {
  field: string;
  target: Goals.Target;
  currentOpenTarget: string | undefined;
  setTargetOpen: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function TargetField({ field, target, currentOpenTarget, setTargetOpen }: TargetFieldProps) {
  const [targets, setTargets] = useFieldValue<Goals.Target[]>(field);

  const targetName = `target-${target.id}`;
  const isOpen = React.useMemo(() => compareIds(target.id, currentOpenTarget), [target.id, currentOpenTarget]);

  const open = () => setTargetOpen(target.id!);
  const close = () => setTargetOpen(undefined);

  const form = Forms.useForm({
    fields: {
      [targetName]: target.value,
    },
    cancel: close,
    submit: () => {
      const currTarget = targets.find((t) => compareIds(t.id, target.id));

      if (currTarget) {
        currTarget.value = form.values[targetName];
      }

      setTargets([...targets]);
      close();
    },
  });

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={open}>
      <Target target={target} isOpen={isOpen} />
      <PopupContent form={form} targetName={targetName} />
    </DropdownMenu.Root>
  );
}

function Target({ target, isOpen }) {
  const containerClass = classNames("px-2 py-2 -mx-2 cursor-pointer group hover:bg-surface-dimmed", {
    "bg-surface-highlight": isOpen,
  });

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="mb-2 flex items-start justify-between">
            <div className="font-medium">{target.name}</div>

            <div className="flex items-center gap-2">
              <div className="tracking-wider text-sm font-medium">
                {target.value} / {target.to}
              </div>
              <PopupTrigger />
            </div>
          </div>

          <ProgressBar
            percentage={findPercentage(target)}
            width="w-full"
            height="h-1.5"
            rounded={false}
            bgColor="var(--color-stroke-base)"
          />
        </div>
      </div>
    </div>
  );
}

function PopupTrigger() {
  return (
    <DropdownMenu.Trigger>
      <GhostButton size="xxs" spanButton>
        Edit
      </GhostButton>
    </DropdownMenu.Trigger>
  );
}

function PopupContent({ form, targetName }) {
  const menuContentClass = classNames(
    "relative rounded-md mt-1 z-10 px-1 py-1.5",
    "shadow-xl ring-1 transition ring-surface-outline",
    "focus:outline-none",
    "bg-surface-base",
    "animateMenuSlideDown",
  );

  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content className={menuContentClass} align="end" sideOffset={25}>
        <div className="w-96 p-4">
          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <Forms.NumberInput field={targetName} label="New value" autoFocus />
            </Forms.FieldGroup>

            <Forms.Submit saveText="Update" cancelText="Dismiss" />
          </Forms.Form>
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}
