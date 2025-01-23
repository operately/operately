import React, { useState } from "react";
import * as Icons from "@tabler/icons-react";

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
import { AvatarLink } from "@/components/Avatar";
import AvatarList from "@/components/AvatarList";

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

      <div className="overflow-hidden mt-8">
        {context.tree.map((root) => (
          <NodeView key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}

function NodeView({ node, index }: { node: Node; index?: number }) {
  return (
    <div>
      {node.type === "goal" ? (
        <GoalHeader node={node as GoalNode} index={index} />
      ) : (
        <ProjectHeader node={node as ProjectNode} index={index} />
      )}
      <NodeChildren node={node} />
    </div>
  );
}

function ProjectHeader({ node, index }: { node: ProjectNode; index?: number }) {
  const testId = createTestId("project", node.project.name!);
  const h = index === 0 ? 14 : 90;

  return (
    <HeaderContainer node={node} data-test-id={testId}>
      {node.depth > 0 && (
        <div className="absolute" style={{ left: -28, top: -h }}>
          <div className="border-l border-b border-stone-300 rounded-bl-xl" style={{ height: h + 12, width: 28 }}></div>
        </div>
      )}

      <div className="flex items-center gap-1">
        <NodeIcon node={node} />
        <div className="ml-1 flex items-center gap-2">
          <NodeName node={node} />
          <AvatarList
            people={node.asProjectNode().project.contributors!.map((c) => c.person!)}
            size={16}
            linked
            maxElements={10}
            stacked
          />
        </div>
      </div>

      <ProjectDetails node={node} />
    </HeaderContainer>
  );
}

function GoalHeader({ node, index }: { node: GoalNode; index?: number }) {
  const [hovered, setHovered] = useState(false);
  const testId = createTestId("goal", node.name!);

  const h = index === 0 ? 20 : 80;

  return (
    <HeaderContainer
      node={node}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-test-id={testId}
    >
      {node.depth > 0 && (
        <div className="absolute" style={{ left: -28, top: -h }}>
          <div className="border-l border-b border-stone-300 rounded-bl-xl" style={{ height: h + 12, width: 28 }}></div>
        </div>
      )}

      <div className="flex justify-between">
        <div className="flex items-center gap-1 relative truncate">
          <NodeIcon node={node} />

          <div className="ml-1 flex items-center gap-1">
            <NodeName node={node} />
            <AvatarLink person={node.asGoalNode().champion} size={16} className="flex flex-col items-center" />
          </div>
        </div>
        <GoalActions node={node.asGoalNode()} hovered={hovered} />
      </div>

      <div className="flex items-center gap-1.5 text-xs leading-snug ml-8">
        <span>Product</span>
        <MiddotDot />
        <span className="mr-1">On track</span>
        <NodeProgress node={node} />
      </div>

      <GoalDetails node={node.asGoalNode()} />
    </HeaderContainer>
  );
}

function NodeChildren({ node }: { node: Node }) {
  const { expanded, toggleExpanded } = useExpandable();

  const size = useWindowSizeBreakpoints();
  const padding = match(size)
    .with("xl", () => 40)
    .with("lg", () => 40)
    .with("md", () => 35)
    .with("sm", () => 30)
    .otherwise(() => 25);

  if (node.children.length === 0) return <div className="mb-4"></div>;

  if (!expanded[node.id] || !node.hasChildren) {
    return (
      <div className="mb-5">
        <div className="-mt-5" style={{ marginLeft: node.depth * padding }}>
          <div className="border-l border-stone-300 ml-3 h-7"></div>
          <div
            className="flex items-center ml-1 gap-1 text-stone-500 text-xs bg-surface-base"
            onClick={() => toggleExpanded(node.id)}
          >
            <Icons.IconCirclePlus className="text-stone-300 mr-2 hover:text-stone-500 cursor-pointer" size={16} />{" "}
            {node.children.length} subgoals
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 -mt-5">
      <div className="mb-2" style={{ marginLeft: node.depth * padding }}>
        <div className="border-l border-stone-300 ml-3 h-5"></div>
        <div
          className="flex items-center ml-1 gap-1 text-stone-500 text-xs bg-surface-base relative z-10"
          onClick={() => toggleExpanded(node.id)}
        >
          <Icons.IconCircleMinus className="text-stone-300 mr-2 hover:text-stone-500 cursor-pointer" size={16} />
        </div>
      </div>

      {node.children?.map((node, index) => <NodeView key={node.id} node={node} index={index} />)}
    </div>
  );
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
        <ChevronIcon
          size={14}
          className="cursor-pointer text-content-dimmed"
          onClick={handleClick}
          data-test-id={testId}
        />
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

  const className = classNames("relative");

  const inner = classNames("relative z-2", {});

  return (
    <div className={className} {...props} style={{ marginLeft: props.node.depth * padding }}>
      <div className={inner}>
        <div>{props.children}</div>
      </div>
    </div>
  );
}

function MiddotDot() {
  return <span className="text-content-dimmed">•</span>;
}
