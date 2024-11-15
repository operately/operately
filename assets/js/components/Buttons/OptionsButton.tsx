import React from "react";

import * as Popover from "@radix-ui/react-popover";
import { IconChevronDown, IconProps } from "@tabler/icons-react";

interface Option {
  label: string;
  action: () => void;
  icon?: React.ComponentType<IconProps>;
  testId?: string;
}

interface Props {
  options: Option[];
  align?: "center" | "start" | "end";
  testId?: string;
}

export function OptionsButton({ options, align = "center", testId }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          className="flex items-center justify-center gap-1 py-1 px-3 border border-accent-1 rounded-lg text-white-1 bg-accent-1 hover:bg-accent-1-light cursor-pointer"
          data-test-id={testId}
        >
          Add
          <IconChevronDown size={16} />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="flex flex-col bg-surface-base rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden"
          align={align}
          sideOffset={5}
        >
          <Popover.Arrow className="fill-surface-outline scale-150" />
          {options.map((option, idx) => (
            <div
              onClick={option.action}
              className="cursor-pointer px-4 py-2 flex items-center gap-1 border-b border-surface-outline hover:bg-surface-accent last:border-b-0"
              data-test-id={option.testId}
              key={idx}
            >
              {option.icon && <option.icon size={20} />}
              {option.label}
            </div>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
