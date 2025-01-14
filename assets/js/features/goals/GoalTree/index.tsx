import React, { useState } from "react";
import * as Icons from "@tabler/icons-react";

import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { createTestId } from "@/utils/testid";

import { match } from "ts-pattern";
import { useWindowSizeBreakpoints } from "@/components/Pages";
import { useTreeContext, TreeContextProvider, TreeContextProviderProps } from "./treeContext";
import {
  ExpandGoalSuccessConditions,
  GoalActions,
  GoalDetails,
  GoalProgressBar,
  GoalTimeframe,
} from "./components/GoalDetails";
import { ContributorsList, NextMilestone, ProjectDetails } from "./components/ProjectDetails";
import { GoalNode, Node, ProjectNode } from "./tree";
import { useExpandable } from "./context/Expandable";
import { NodeIcon } from "./components/NodeIcon";
import { NodeName } from "./components/NodeName";
import { Controls } from "./components/Controls";
import classNames from "classnames";

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

      <div className="border-b border-stroke-base border-dotted">
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
      <div className="flex justify-between items-center relative flex-1 gap-4">
        <div className="flex-1 flex items-center gap-1">
          <NodeExpandCollapseToggle node={node} />
          <NodeIcon node={node} />
          <div className="leading-snug ml-2">
            <NodeName node={node} />
            <div className="text-[10px]">{node.space.name}</div>
          </div>
        </div>
      </div>

      <ProjectDetails node={node} />
    </HeaderContainer>
  );
}
// <ContributorsList project={node.project} />

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
        <div className="flex justify-between items-center relative flex-1 gap-4">
          <div className="flex-1 flex items-center gap-1">
            <NodeExpandCollapseToggle node={node} />
            <NodeIcon node={node} />

            <div className="ml-2 leading-snug">
              <NodeName node={node} />
              <div className="text-[11px]">
                {node.space.name}
                <Middot /> 4 targets, 10 subgoals, 3 projects
              </div>
            </div>
          </div>

          <GoalTimeframe goal={node.goal} />
          <div
            className="text-xs text-left w-24 py-1 bg-sky-100 rounded px-2"
            style={{
              fontWeight: node.goal.isClosed ? "bold" : "normal",
            }}
          >
            {node.goal.isClosed ? "Completed" : "On track"}
          </div>
          <GoalProgressBar node={node} />
          <Icons.IconDotsVertical size={16} className="cursor-pointer text-content-dimmed" />
        </div>
      </div>
    </HeaderContainer>
  );
}

function Middot() {
  return <span className="text-content-dimmed mx-0.5">•</span>;
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
    <div className="mr-2 p-0.5">
      {node.children.length > 0 ? (
        <ChevronIcon size={12} className="cursor-pointer" onClick={handleClick} data-test-id={testId} />
      ) : (
        <div className="w-3 h-3" />
      )}
    </div>
  );
}

function HeaderContainer(props: { node: Node } & React.HTMLAttributes<HTMLDivElement>) {
  const size = useWindowSizeBreakpoints();

  const padding = match(size)
    .with("xl", () => 40)
    .with("lg", () => 40)
    .with("md", () => 35)
    .with("sm", () => 30)
    .otherwise(() => 25);

  const className = classNames("border-t py-2.5", {
    "border-stroke-base": true,
    "border-dotted": true,
  });

  return (
    <div
      className={className}
      style={{
        paddingLeft: props.node.depth * padding,
      }}
      {...props}
    >
      <div>{props.children}</div>
    </div>
  );
}
