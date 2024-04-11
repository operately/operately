import * as React from "react";
import * as Popover from "@radix-ui/react-popover";

import classNames from "classnames";

import { DivLink } from "@/components/Link";

interface DropdownMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;

  trigger: React.ReactNode;
  options: React.ReactNode[];

  testId?: string;
}

export function DropdownMenu({ open, setOpen, trigger, options, testId }: DropdownMenuProps) {
  const dropdownClassName = classNames("rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden");

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild data-test-id={testId}>
        {trigger}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={dropdownClassName} align="center" sideOffset={5}>
          <div className="bg-surface px-1 py-1 flex flex-col gap-0.5">{options}</div>

          <Popover.Arrow className="fill-surface-outline scale-150" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function DropdownMenuLinkItem({ to, title, testId }: { to: string; title: string; testId?: string }) {
  return (
    <DivLink
      to={to}
      className="hover:bg-accent-1 hover:text-white-1 rounded-md px-1.5 py-0.5 text-sm cursor-pointer"
      testId={testId}
    >
      {title}
    </DivLink>
  );
}
