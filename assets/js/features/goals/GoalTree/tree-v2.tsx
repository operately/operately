import React, { useState } from "react";

import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { GhostButton } from "@/components/Buttons";

import { useTreeContext, TreeContextProvider, TreeContextProviderProps } from "./treeContext";
import { ExpandGoalSuccessConditions, GoalActions, GoalDetails, GoalProgressBar } from "./components/GoalDetails";
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
      {node.type === "goal" ? <GoalHeader node={node as GoalNode} /> : <ProjectHeader node={node as ProjectNode} />}
      <NodeChildren node={node} />
    </div>
  );
}

function ProjectHeader({ node }: { node: ProjectNode }) {
  return (
    <HeaderContainer node={node}>
      <div className="flex items-center gap-1">
        <NodeIcon node={node} />
        <NodeName node={node} />
      </div>

      <ProjectDetails node={node} />
    </HeaderContainer>
  );
}

function GoalHeader({ node }: { node: GoalNode }) {
  const [hovered, setHovered] = useState(false);

  return (
    <HeaderContainer node={node} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="flex items-center gap-1">
        <NodeExpandCollapseToggle node={node} />
        <NodeIcon node={node} />
        <NodeName node={node} />
        <GoalProgressBar node={node} />
        <ExpandGoalSuccessConditions node={node} />
        <GoalActions node={node} hovered={hovered} />
      </div>

      <GoalDetails node={node} />
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

  if (!node.hasChildren) return <></>;

  const handleClick = () => toggleExpanded(node.id);
  const ChevronIcon = expanded[node.id] ? IconChevronDown : IconChevronRight;

  return <ChevronIcon size={16} className="cursor-pointer" onClick={handleClick} />;
}

function HeaderContainer(props) {
  return (
    <div className="border-t border-surface-outline py-3" {...props}>
      <div style={{ paddingLeft: props.node.depth * 30 }}>{props.children}</div>
    </div>
  );
}
