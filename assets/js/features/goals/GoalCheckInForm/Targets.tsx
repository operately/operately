import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Target } from "@/models/goals";
import classNames from "classnames";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import Forms from "@/components/Forms";

export function Targets() {
  return (
    <div className="mt-4">
      <div className="mb-1 font-bold">Update targets</div>

      <div className="grid grid-cols-1">
        <Target name="Figure out how to open a new office in Brazil" value={0} total={0} progress={0} />
        <Target name="Eliminate blockers for selling in China" value={4} total={20} progress={20} />
        <Target name="Achieve 1000+ active users in new countries" value={700} total={1000} progress={70} />
        <Target
          name="Increase revenue by 20% from international sales"
          value={"$ 1.2M"}
          total={"$ 1M"}
          progress={100}
        />
      </div>
    </div>
  );
}

const menuContentClass = classNames(
  "relative rounded-md mt-1 z-10 px-1 py-1.5",
  "shadow-xl ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface-base",
  "animateMenuSlideDown",
);

function Target({ name, value, total, progress }) {
  const [open, setOpen] = React.useState(false);

  const trigger = (
    <div
      className={
        "hover:bg-surface-highlight px-2 py-2 -mx-2 cursor-pointer" + " " + (open ? "bg-surface-highlight" : "")
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="font-medium">{name}</div>
            <div className="tracking-wider text-sm font-medium">
              {value} / {total}
            </div>
          </div>

          <LargeProgress progress={progress} color="bg-accent-1" />
        </div>
      </div>
    </div>
  );

  const form = Forms.useForm({
    fields: {
      value: 700,
    },
    submit: () => {},
  });

  const content = (
    <div>
      <div className="w-96 p-4">
        <Forms.Form form={form}>
          <Forms.FieldGroup>
            <Forms.TextInput field="value" label="New value" autoFocus />
          </Forms.FieldGroup>
        </Forms.Form>

        <div className="flex items-center gap-2 mt-4">
          <PrimaryButton size="sm" onClick={() => setOpen(false)}>
            Update
          </PrimaryButton>
          <SecondaryButton size="sm" onClick={() => setOpen(false)}>
            Dismiss
          </SecondaryButton>
        </div>
      </div>
    </div>
  );

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} align="center" sideOffset={-25}>
          {content}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function LargeProgress({ progress, color }) {
  const outer = classNames("h-1.5 bg-stroke-base mt-2");
  const inner = classNames("h-1.5", color);

  return (
    <div className={outer}>
      <div className={inner} style={{ width: progress + "%" }} />
    </div>
  );
}
