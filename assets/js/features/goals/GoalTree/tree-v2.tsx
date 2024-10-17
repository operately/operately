import React from "react";

import { IconChevronDown, IconChevronRight, IconMinus, IconPlus } from "@tabler/icons-react";
import { GhostButton } from "@/components/Buttons";
import { MiniPieChart } from "@/components/MiniPieChart";
import { assertPresent } from "@/utils/assertions";
import { includesId } from "@/routes/paths";
import { ProgressBar } from "@/components/ProgressBar";

import { useTreeContext, TreeContextProvider, TreeContextProviderProps } from "./treeContext";
import { GoalNode, Node, ProjectNode } from "./tree";
import { useExpandable } from "./context/Expandable";
import { NodeIcon } from "./components/NodeIcon";
import { NodeName } from "./components/NodeName";
import ProjectDetails from "./components/ProjectDetails";

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

      <div className="border-b border-surface-outline">
        {context.tree.map((root) => (
          <NodeView key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}

function Controls() {
  return (
    <div className="flex mb-4 items-center gap-2">
      <GhostButton size="sm">Expand all</GhostButton>
      <GhostButton size="sm">View options</GhostButton>
    </div>
  );
}

function NodeView({ node }: { node: Node }) {
  return (
    <div>
      <NodeHeader node={node} />
      <NodeChildren node={node} />
    </div>
  );
}

function NodeHeader({ node }: { node: Node }) {
  return (
    <div className="border-t border-surface-outline py-3">
      <div style={{ paddingLeft: node.depth * 30 }}>
        <div className="inline-flex items-center gap-1 truncate flex-1 group pr-2">
          <NodeExpandCollapseToggle node={node} />
          <NodeIcon node={node} />
          <NodeName node={node} />
          {node.type === "goal" && <GoalProgressBar node={node as GoalNode} />}
          {node.type == "goal" && <ExpandGoalSuccessConditions node={node as GoalNode} />}
        </div>

        <ResourceDetails node={node} />
      </div>
    </div>
  );
}

function NodeChildren({ node }: { node: Node }) {
  const { expanded } = useExpandable();

  if (!expanded[node.id] || !node.hasChildren) return <></>;

  return <>{node.children?.map((node) => <NodeView key={node.id} node={node} />)}</>;
}

function NodeExpandCollapseToggle({ node }: { node: Node }) {
  const { expanded, toggleExpanded } = useExpandable();

  if (!node.hasChildren) return <></>;

  const handleClick = () => toggleExpanded(node.id);
  const ChevronIcon = expanded[node.id] ? IconChevronDown : IconChevronRight;

  return <ChevronIcon size={16} className="cursor-pointer" onClick={handleClick} />;
}

function GoalProgressBar({ node }: { node: GoalNode }) {
  assertPresent(node.goal.progressPercentage, "progressPercentage must be present in goal");

  return <ProgressBar percentage={node.goal.progressPercentage} className="ml-2" />;
}

function ResourceDetails({ node }: { node: Node }) {
  switch (node.type) {
    case "goal":
      return <GoalDetails node={node as GoalNode} />;
    case "project":
      return <ProjectDetails node={node as ProjectNode} />;
  }
}

function GoalDetails({ node }: { node: GoalNode }) {
  return (
    <div className="pl-[42px]">
      <GoalSuccessConditions node={node} />
    </div>
  );
}

function ExpandGoalSuccessConditions({ node }: { node: GoalNode }) {
  const { goalExpanded, toggleGoalExpanded } = useExpandable();

  return (
    <div
      onClick={() => toggleGoalExpanded(node.goal.id!)}
      className="ml-2 h-[20px] w-[20px] rounded-full border-2 border-surface-outline flex items-center justify-center cursor-pointer"
    >
      {includesId(goalExpanded, node.goal.id) ? (
        <IconMinus size={12} stroke={3} className="border-surface-outline shrink-0" />
      ) : (
        <IconPlus size={12} stroke={3} className="border-surface-outline shrink-0" />
      )}
    </div>
  );
}

function GoalSuccessConditions({ node }: { node: GoalNode }) {
  const { goalExpanded } = useExpandable();
  assertPresent(node.goal.targets, "targets must be present in goal");

  if (!includesId(goalExpanded, node.goal.id)) return <></>;

  return (
    <div>
      {node.goal.targets.map((t) => {
        const total = t.to! - t.from!;
        const completed = t.value! - t.from!;

        return (
          <div key={t.id} className="flex items-center gap-2">
            <MiniPieChart total={total} completed={completed} />
            {t.name}
          </div>
        );
      })}
    </div>
  );
}
