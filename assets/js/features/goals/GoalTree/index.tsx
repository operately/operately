import React, { useState } from "react";

import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { createTestId } from "@/utils/testid";

import { match } from "ts-pattern";
import { useWindowSizeBreakpoints } from "@/components/Pages";
import { useTreeContext, TreeContextProvider, TreeContextProviderProps } from "./treeContext";
import { GoalActions, GoalDetails } from "./components/GoalDetails";
import { ProjectDetails } from "./components/ProjectDetails";
import { GoalNode, Node, ProjectNode } from "./tree";
import { useExpandable } from "./context/Expandable";
import { NodeIcon } from "./components/NodeIcon";
import { NodeName } from "./components/NodeName";
import { NodeProgress } from "./components/NodeProgress";
import { Controls } from "./components/Controls";
import { GoalStatusCompact } from "./components/GoalStatusCompact";
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
        <NodeProgress node={node} />
      </div>

      <ProjectDetails node={node} />
    </HeaderContainer>
  );
}

function GoalHeader({ node }: { node: Node }) {
  const [hovered, setHovered] = useState(false);
  const testId = createTestId("goal", node.name!);

  return (
    <HeaderContainer
      node={node}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-test-id={testId}
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-1 relative truncate">
          <NodeExpandCollapseToggle node={node} />
          <NodeIcon node={node} />
          <NodeName node={node} />
          <NodeProgress node={node} />
          <GoalStatusCompact node={node.asGoalNode()} />
        </div>
        <GoalActions node={node.asGoalNode()} hovered={hovered} />
      </div>

      <GoalDetails node={node.asGoalNode()} />
    </HeaderContainer>
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

  const className = classNames("border-t border-stroke-base relative");

  const inner = classNames("my-0.5 py-2 relative z-2", {
    "bg-gray-50 dark:bg-gray-900/40": props.node.isClosed,
  });

  return (
    <div className={className} {...props}>
      <div className={inner}>
        <div style={{ paddingLeft: props.node.depth * padding }}>{props.children}</div>
      </div>

      {props.node.isClosed && (
        <div className="absolute right-4 -translate-y-1/2 top-1/2 select-none">
          <span className="text-xs uppercase tracking-wide opacity-25">Closed</span>
        </div>
      )}
    </div>
  );
}
