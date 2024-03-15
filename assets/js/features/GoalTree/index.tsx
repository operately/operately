import * as React from "react";
import * as Goals from "@/models/goals";

import { Link } from "@/components/Link";
import { Tree, Node } from "./tree";

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
  return (
    <div>
      <div>
        <Link to={`/goals/${node.goal.id}`}>{node.goal.name}</Link>
      </div>
      <div className="ml-4">
        {node.children.map((child) => (
          <GoalNode node={child} />
        ))}
      </div>
    </div>
  );
}
