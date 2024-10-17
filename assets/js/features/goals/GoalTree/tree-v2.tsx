import React from "react";

import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { GhostButton } from "@/components/Buttons";

import { useTreeContext, TreeContextProvider, TreeContextProviderProps } from "./treeContext";
import { useExpandable } from "./context/Expandable";
import { GoalNode, Node } from "./tree";
import { NodeIcon } from "./components/NodeIcon";
import { NodeName } from "./components/NodeName";

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
      <div
        className="inline-flex items-center gap-1 truncate flex-1 group pr-2"
        style={{ paddingLeft: node.depth * 30 }}
      >
        <NodeExpandCollapseToggle node={node} />
        <NodeIcon node={node} />
        <NodeName node={node} />
        {node.type === "goal" && <GoalProgressBar node={node as GoalNode} />}
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

  if (!node.hasChildren) return null;

  const handleClick = () => toggleExpanded(node.id);
  const size = 16;
  const ChevronIcon = expanded[node.id] ? IconChevronDown : IconChevronRight;

  return <ChevronIcon size={size} className="cursor-pointer" onClick={handleClick} />;
}

function GoalProgressBar({ node }: { node: GoalNode }) {
  return (
    <div className={"ml-2 w-24 h-2.5 bg-surface-outline rounded relative"}>
      <div
        className="bg-accent-1 rounded absolute top-0 bottom-0 left-0"
        style={{ width: `${node.goal.progressPercentage}%` }}
      />
    </div>
  );
}
