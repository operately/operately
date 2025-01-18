import React, { useState } from "react";
import * as Timeframes from "@/utils/timeframes";

import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { createTestId } from "@/utils/testid";

import { match } from "ts-pattern";
import { useWindowSizeBreakpoints } from "@/components/Pages";
import { useTreeContext, TreeContextProvider, TreeContextProviderProps } from "./treeContext";
import { GoalActions, GoalDetails, GoalProgressBar } from "./components/GoalDetails";
import { ProjectDetails } from "./components/ProjectDetails";
import { GoalNode, Node, ProjectNode } from "./tree";
import { useExpandable } from "./context/Expandable";
import { NodeIcon } from "./components/NodeIcon";
import { NodeName } from "./components/NodeName";
import { Controls } from "./components/Controls";
import { durationHumanized } from "@/utils/time";

export function GoalTree(props: TreeContextProviderProps) {
  return (
    <TreeContextProvider {...props}>
      <GoalTreeRoots />
    </TreeContextProvider>
  );
}

function GoalTreeRoots() {
  const context = useTreeContext();

  return (
    <div>
      <Controls />

      <div className="border-b border-stroke-base overflow-hidden">
        {context.tree.map((root) => (
          <NodeView key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}

function NodeView({ node }: { node: Node }) {
  return (
    <div>
      {node.type === "goal" ? <GoalHeader node={node as GoalNode} /> : <ProjectHeader node={node as ProjectNode} />}
      <NodeChildren node={node} />
    </div>
  );
}

function ProjectHeader({ node }: { node: ProjectNode }) {
  const testId = createTestId("project", node.project.name!);

  return (
    <HeaderContainer node={node} data-test-id={testId}>
      <div className="flex items-center gap-1">
        <NodeExpandCollapseToggle node={node} />
        <NodeIcon node={node} />
        <NodeName node={node} />
      </div>

      <ProjectDetails node={node} />
    </HeaderContainer>
  );
}

function GoalHeader({ node }: { node: GoalNode }) {
  const [hovered, setHovered] = useState(false);
  const testId = createTestId("goal", node.goal.name!);

  return (
    <HeaderContainer
      node={node}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-test-id={testId}
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-1 relative">
          <NodeExpandCollapseToggle node={node} />
          <NodeIcon node={node} />
          <NodeName node={node} />
          <GoalProgressBar node={node} />
          <GoalOverdueIndicator node={node} />
        </div>
        <GoalActions node={node} hovered={hovered} />
      </div>

      <GoalDetails node={node} />
    </HeaderContainer>
  );
}

function GoalOverdueIndicator({ node }: { node: Node }) {
  const { density } = useTreeContext();

  if (density !== "compact") return null;
  if (node.type !== "goal") return null;

  const goal = node.asGoalNode().goal!;
  const timeframe = Timeframes.parse(goal.timeframe!);
  const isOverdue = Timeframes.isOverdue(timeframe) && !goal.isClosed;

  if (!isOverdue) return null;

  return (
    <span className="text-sm ml-1.5 font-medium">
      <span className="text-content-error">Overdue by {durationHumanized(timeframe.endDate!, new Date())}</span>
    </span>
  );
}

function NodeChildren({ node }: { node: Node }) {
  const { expanded } = useExpandable();

  if (!expanded[node.id] || !node.hasChildren) return <></>;

  return <>{node.children?.map((node) => <NodeView key={node.id} node={node} />)}</>;
}

function NodeExpandCollapseToggle({ node }: { node: Node }) {
  const { expanded, toggleExpanded } = useExpandable();

  const resourceId = "goal" in node ? (node as GoalNode).goal.id : (node as ProjectNode).project.id;
  const testId = createTestId("toggle-node", resourceId!);
  const handleClick = () => toggleExpanded(node.id);
  const ChevronIcon = expanded[node.id] ? IconChevronDown : IconChevronRight;

  return (
    <div className="w-5">
      {node.children.length > 0 && (
        <ChevronIcon size={16} className="cursor-pointer" onClick={handleClick} data-test-id={testId} />
      )}
    </div>
  );
}

function HeaderContainer(props: { node: Node } & React.HTMLAttributes<HTMLDivElement>) {
  const size = useWindowSizeBreakpoints();

  const padding = match(size)
    .with("xl", () => 45)
    .with("lg", () => 40)
    .with("md", () => 35)
    .with("sm", () => 30)
    .otherwise(() => 25);

  return (
    <div className="border-t border-stroke-base py-3" {...props}>
      <div style={{ paddingLeft: props.node.depth * padding }}>{props.children}</div>
    </div>
  );
}
