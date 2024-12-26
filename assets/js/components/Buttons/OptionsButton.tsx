import React, { ReactNode } from "react";

import * as Popover from "@radix-ui/react-popover";
import { IconChevronDown, IconProps } from "@tabler/icons-react";

interface ActionOption {
  label: string;
  action: () => void;
  hidden?: boolean;
  icon?: React.ComponentType<IconProps>;
  testId?: string;
}

interface ElementOption {
  element: ReactNode;
  hidden?: boolean;
}

interface Props {
  options: (ActionOption | ElementOption)[];
  align?: "center" | "start" | "end";
  testId?: string;
}

export function OptionsButton({ options, align = "center", testId }: Props) {
  const [open, setOpen] = React.useState(false);
  const availableOptions = options.filter((option) => !option.hidden);

  if (availableOptions.length < 1) return <></>;

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
          {availableOptions.map((option, idx) => (
            <Option option={option} key={idx} />
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Option({ option }: { option: ActionOption | ElementOption }) {
  if ("label" in option && "action" in option)
    return (
      <Border>
        <div
          className="cursor-pointer px-4 py-2 flex items-center gap-1 hover:bg-surface-accent"
          onClick={option.action}
          data-test-id={option.testId}
        >
          {option.icon && <option.icon size={20} />}
          {option.label}
        </div>
      </Border>
    );

  return (
    <Border>
      <div className="px-4 py-2">{option.element}</div>
    </Border>
  );
}

function Border({ children }: { children: ReactNode }) {
  return <div className="border-b border-surface-outline last:border-b-0">{children}</div>;
}
