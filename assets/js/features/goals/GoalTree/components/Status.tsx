import React, { ReactNode, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import * as Popover from "@radix-ui/react-popover";

import { createTestId } from "@/utils/testid";
import { StatusIndicator } from "@/features/ProjectListItem/StatusIndicator";
import { SmallStatusIndicator } from "@/components/status";
import { IconArrowUpRight } from "@tabler/icons-react";
import { Paths } from "@/routes/paths";
import { Node } from "../tree";

export function Status({ node, children }: { node: Node; children: ReactNode }) {
  const [hoveringTrigger, setHoveringTrigger] = useState(false);
  const [hoveringContent, setHoveringContent] = useState(false);

  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const testId = createTestId("status", node.id!);
  const open = hoveringTrigger || hoveringContent;

  const handleClick = useClickHandler(node);

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

  if (node.type === "project" && !node.asProjectNode().lastCheckIn) {
    return <NodeStatusIndicator node={node} />;
  }

  return (
    <Popover.Root open={open}>
      <Popover.Trigger asChild onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div
          className="flex items-end gap-[2px] cursor-pointer hover:underline underline-offset-4"
          data-test-id={testId}
        >
          <NodeStatusIndicator node={node} />
          <IconArrowUpRight size={12} className="mb-1" />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <LatestCheckIn setHoveringContent={setHoveringContent} children={children} />
      </Popover.Portal>
    </Popover.Root>
  );
}

function useClickHandler(node: Node) {
  const navigate = useNavigate();

  return () => {
    if (node.type === "goal") {
      if (node.isClosed) {
        return navigate(Paths.goalPath(node.id!));
      } else {
        return navigate(Paths.goalProgressUpdatePath(node.asGoalNode()!.lastCheckIn!.id!));
      }
    }

    if (node.type === "project") {
      if (node.isClosed) {
        return navigate(Paths.projectRetrospectivePath(node.id!));
      } else {
        return navigate(Paths.projectCheckInPath(node.asProjectNode()!.lastCheckIn!.id!));
      }
    }

    throw new Error(`Invalid node type: ${node.type}`);
  };
}

function NodeStatusIndicator({ node }: { node: Node }) {
  if (node.type === "project") {
    if (node.isClosed) {
      return <SmallStatusIndicator status="completed" size="sm" textClassName="text-content-dimmed" />;
    } else {
      return <StatusIndicator project={node.asProjectNode().project} size="sm" textClassName="text-content-dimmed" />;
    }
  }

  if (node.type === "goal") {
    if (node.isClosed) {
      const status = node.asGoalNode().goal!.success ? "accomplished" : "not_accomplished";

      return <SmallStatusIndicator status={status} size="sm" textClassName="text-content-dimmed" />;
    } else {
      const status = node.asGoalNode().lastCheckIn?.status! || "on_track";
      return <SmallStatusIndicator status={status} size="sm" textClassName="text-content-dimmed" />;
    }
  }

  throw new Error("Invalid node type");
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
      className="px-8 w-[500px] max-h-[400px] bg-surface-base rounded-lg border border-surface-outline z-[100] shadow-xl overflow-y-scroll"
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
