import * as React from "react";
import * as Goals from "@/models/goals";
import * as Icons from "@tabler/icons-react";
import * as Projects from "@/models/projects";

import { DivLink } from "@/components/Link";
import { Tree, Node } from "./tree";
import classNames from "classnames";
import { Paths } from "@/routes/paths";

export function GoalTree({ goals }: { goals: Goals.Goal[] }) {
  const tree = Tree.build(goals);

  return (
    <div>
      {tree.getRoots().map((root) => (
        <GoalNode node={root} />
      ))}
    </div>
  );
}

function GoalNode({ node }: { node: Node }) {
  const titleClass = classNames({
    "font-bold text-lg": node.depth === 0,
    "font-medium": node.depth > 0,
  });

  const iconSize = node.depth === 0 ? 16 : 14;
  const path = Paths.goalPath(node.goal.id);

  return (
    <div className="my-1">
      <div className="flex items-center gap-1.5">
        <Icons.IconTarget size={iconSize} className="text-red-500" />
        <DivLink to={path} className={titleClass}>
          {node.goal.name}
        </DivLink>
      </div>
      <div className="relative">
        <div className="absolute top-0 left-1.5 w-0.5 h-full bg-surface-outline" />
        <div className="pl-6">
          {node.children.map((child) => (
            <GoalNode node={child} />
          ))}
        </div>
        <div className="pl-6">{node.goal.projects?.map((project) => <ProjectNode project={project!} />)}</div>
      </div>
    </div>
  );
}

function ProjectNode({ project }: { project: Projects.Project }) {
  return (
    <div className="flex items-center gap-1.5 my-1.5">
      <Icons.IconHexagonFilled size={14} className="text-blue-500" />
      <div className="font-medium text-sm">{project.name}</div>
    </div>
  );
}
