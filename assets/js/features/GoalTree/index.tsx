import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import { DivLink } from "@/components/Link";
import classNames from "classnames";
import { Paths } from "@/routes/paths";

import { Node } from "./tree";
import { useTreeContext, TreeContextProvider } from "./treeContext";

export function GoalTree({ goals }: { goals: Goals.Goal[] }) {
  return (
    <TreeContextProvider goals={goals}>
      <GoalTreeRoots />
    </TreeContextProvider>
  );
}

function GoalTreeRoots() {
  const { tree } = useTreeContext();

  return (
    <div>
      {tree.getRoots().map((root) => (
        <GoalNode node={root} />
      ))}
    </div>
  );
}

function GoalNode({ node }: { node: Node }) {
  return (
    <div className="my-1">
      <GoalHeader node={node} />
      <GoalChildren node={node} />
    </div>
  );
}

function GoalHeader({ node }: { node: Node }) {
  const titleClass = classNames({
    "font-bold text-lg": node.depth === 0,
    "font-medium": node.depth > 0,
  });

  const iconSize = node.depth === 0 ? 16 : 14;
  const path = Paths.goalPath(node.goal.id);

  return (
    <div className="flex items-center gap-1.5 group relative">
      <GoalExpandCollapseToggle node={node} />
      <Icons.IconTarget size={iconSize} className="text-red-500" />
      <DivLink to={path} className={titleClass}>
        {node.goal.name}
      </DivLink>
    </div>
  );
}

function GoalExpandCollapseToggle({ node }: { node: Node }) {
  const { expanded, toggleExpanded } = useTreeContext();

  if (!node.hasChildren) return null;

  const className = classNames("absolute transition-opacity cursor-pointer opacity-0 group-hover:opacity-100", {
    "-left-3": node.depth > 0,
    "-left-4": node.depth === 0,
  });

  const handleClick = () => toggleExpanded(node.goal.id);
  const size = node.depth === 0 ? 14 : 13;
  const ChevronIcon = expanded[node.goal.id] ? Icons.IconChevronDown : Icons.IconChevronRight;

  return <ChevronIcon size={size} className={className} onClick={handleClick} />;
}

function GoalChildren({ node }: { node: Node }) {
  const { expanded } = useTreeContext();

  if (!expanded[node.goal.id]) return null;
  if (!node.hasChildren) return null;

  return (
    <div className="relative">
      <div className="absolute top-0 left-1.5 w-0.5 h-full bg-surface-outline" />
      <div className="pl-6">
        {node.subGoals.map((child) => (
          <GoalNode node={child} />
        ))}
      </div>
      <div className="pl-6">{node.goal.projects?.map((project) => <ProjectNode project={project!} />)}</div>
    </div>
  );
}

function ProjectNode({ project }: { project: Projects.Project }) {
  return (
    <div className="flex items-center gap-1.5 my-1.5">
      <Icons.IconHexagonFilled size={14} className="text-blue-500" />
      <DivLink to={Paths.projectPath(project.id)} className="font-medium text-sm">
        {project.name}
      </DivLink>
    </div>
  );
}
