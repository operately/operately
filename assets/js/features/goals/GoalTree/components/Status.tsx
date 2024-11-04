import React, { ReactNode, useRef, useState } from "react";

import * as Popover from "@radix-ui/react-popover";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { createTestId } from "@/utils/testid";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { IconArrowUpRight } from "@tabler/icons-react";

export function Status({ resource, children }: { resource: Goal | Project; children: ReactNode }) {
  const [clicked, setClicked] = useState(false);
  const [hoveringTrigger, setHoveringTrigger] = useState(false);
  const [hoveringContent, setHoveringContent] = useState(false);

  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const testId = createTestId("status", resource.id!);
  const open = clicked || hoveringTrigger || hoveringContent;

  const handleClick = () => {
    if (open) {
      setClicked(false);
      setHoveringTrigger(false);
      setHoveringContent(false);
    } else {
      setClicked(true);
    }
  };

  const handleMouseEnter = () => {
    clearTimeout(hideTimeoutRef.current);
    showTimeoutRef.current = setTimeout(() => {
      setHoveringTrigger(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setHoveringTrigger(false);
    }, 1000);
  };

  if (!resource.lastCheckIn) {
    return <StatusIndicator project={resource} size="sm" textClassName="text-content-dimmed" />;
  }

  return (
    <Popover.Root open={open} onOpenChange={handleClick}>
      <Popover.Trigger asChild onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div
          className="flex items-end gap-[2px] cursor-pointer hover:underline underline-offset-4"
          data-test-id={testId}
        >
          <StatusIndicator project={resource} size="sm" textClassName="text-content-dimmed" />
          <IconArrowUpRight size={12} className="mb-1" />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <LatestCheckIn setHoveringContent={setHoveringContent} children={children} />
      </Popover.Portal>
    </Popover.Root>
  );
}

interface LatestCheckInProps {
  setHoveringContent: React.Dispatch<React.SetStateAction<boolean>>;
  children: ReactNode;
}

function LatestCheckIn({ setHoveringContent, children }: LatestCheckInProps) {
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    clearTimeout(hideTimeoutRef.current);
    setHoveringContent(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setHoveringContent(false);
    }, 1000);
  };

  return (
    <Popover.Content
      className="px-8 w-[500px] bg-surface-base rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden"
      align="start"
      sideOffset={8}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Popover.Arrow className="fill-surface-outline scale-150" />
      {children}
    </Popover.Content>
  );
}
