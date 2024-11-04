import React, { ReactNode, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import * as Popover from "@radix-ui/react-popover";

import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { createTestId } from "@/utils/testid";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { IconArrowUpRight } from "@tabler/icons-react";
import { Paths } from "@/routes/paths";

interface GoalProps {
  resource: Goal;
  resourceType: "goal";
  children: ReactNode;
}
interface ProjectProps {
  resource: Project;
  resourceType: "project";
  children: ReactNode;
}

export function Status({ resource, resourceType, children }: GoalProps | ProjectProps) {
  const navigate = useNavigate();
  const [hoveringTrigger, setHoveringTrigger] = useState(false);
  const [hoveringContent, setHoveringContent] = useState(false);

  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const testId = createTestId("status", resource.id!);
  const open = hoveringTrigger || hoveringContent;

  const handleClick = () => {
    if (resourceType === "goal") {
      navigate(Paths.goalProgressUpdatePath(resource.lastCheckIn!.id!));
    } else {
      navigate(Paths.projectCheckInPath(resource.lastCheckIn!.id!));
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
    <Popover.Root open={open}>
      <Popover.Trigger asChild onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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
