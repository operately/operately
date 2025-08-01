import * as React from "react";
import * as Goals from "@/models/goals";
import { IconChevronDown, IconChevronRight } from "turboui";

import { buildTree, GoalNode, Node, TreeOptions } from "./tree";

import { NodeIcon } from "./components/NodeIcon";
import { NodeName } from "./components/NodeName";
import { TableRow } from "./components/TableRow";
import { CompanyGoalOption } from "./components/CompanyGoalOption";
import { PrimaryButton } from "turboui";
import { ExpandableProvider, useExpandable } from "./context/Expandable";

import classNames from "classnames";
import { createTestId } from "@/utils/testid";
import { useMe } from "@/contexts/CurrentCompanyContext";

interface Props {
  goals: Goals.Goal[];
  onSelect: (goal: Goals.Goal | null) => void;
  allowCompanyWide?: boolean;
}

export function GoalSelector({ goals, onSelect, allowCompanyWide }: Props) {
  const me = useMe();

  const options = {
    sortColumn: "name",
    sortDirection: "asc",
    showActive: true,
    showPaused: false,
    showCompleted: false,
    showGoals: true,
    showProjects: false,
    ownedBy: "anyone",
    reviewedBy: "anyone",
  } as TreeOptions;

  const tree = React.useMemo(() => buildTree(me!, goals, [], options), [goals, options]);

  return (
    <ExpandableProvider tree={tree}>
      <div>
        {allowCompanyWide && <CompanyGoalOption handleSelect={() => onSelect(null)} />}

        {tree.map((root, index) => (
          <NodeView key={root.id} node={root as GoalNode} onSelect={onSelect} isFirstChild={index === 0} />
        ))}
      </div>
    </ExpandableProvider>
  );
}

interface NodeProps {
  node: GoalNode;
  onSelect: (goal: Goals.Goal) => void;
  isFirstChild?: boolean;
}

function NodeView({ node, onSelect, isFirstChild }: NodeProps) {
  return (
    <div>
      <TableRow topBorder={isFirstChild} className="-mx-12 px-12">
        <div
          className="inline-flex items-center gap-1.5 truncate flex-1 group pr-2"
          style={{ paddingLeft: node.depth * 30 }}
        >
          <NodeExpandCollapseToggle node={node} />
          <NodeIcon node={node as Node} />
          <NodeName node={node as Node} />
          <SubgoalCount node={node} />
        </div>

        <div>
          <PrimaryButton onClick={() => onSelect(node.goal)} size="xxs" testId={createTestId("goal", node.name)}>
            Select
          </PrimaryButton>
        </div>
      </TableRow>

      <ChildGoals node={node} onSelect={onSelect} />
    </div>
  );
}

function ChildGoals({ node, onSelect }: { node: GoalNode; onSelect: (goal: Goals.Goal) => void }) {
  const { expanded } = useExpandable();

  if (!expanded[node.id]) {
    return null;
  }

  return (
    <div>
      {node.children.map((child) => (
        <NodeView key={child.id} node={child as GoalNode} onSelect={onSelect} />
      ))}
    </div>
  );
}

function NodeExpandCollapseToggle({ node }: { node: GoalNode }) {
  const { toggleExpanded, expanded } = useExpandable();

  if (!node.hasChildren) return null;

  const handleClick = () => toggleExpanded(node.id);
  const size = 16;
  const ChevronIcon = expanded[node.id] ? IconChevronDown : IconChevronRight;

  const className = classNames(
    "absolute flex items-center flex-row-reverse gap-1",
    "-translate-x-[42px] w-[40px]",
    "opacity-0 group-hover:opacity-100 transition-opacity",
  );

  return (
    <div className={className}>
      <ChevronIcon size={size} className="cursor-pointer" onClick={handleClick} />
    </div>
  );
}

function SubgoalCount({ node }: { node: GoalNode }) {
  const { expanded } = useExpandable();

  if (!node.hasChildren) return null;
  if (expanded[node.id]) return null;

  return <div className="text-xs text-gray-500">{node.childrenInfoLabel()}</div>;
}
