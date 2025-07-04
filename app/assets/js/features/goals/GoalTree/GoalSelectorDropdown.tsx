import * as React from "react";
import * as Goals from "@/models/goals";

import { buildTree, GoalNode, Node, TreeOptions } from "./tree";

import { NodeIcon } from "./components/NodeIcon";
import { TableRow } from "./components/TableRow";
import { CompanyGoalOption } from "./components/CompanyGoalOption";
import { PrimaryButton, IconChevronDown, IconChevronRight } from "turboui";
import { ExpandableProvider, useExpandable } from "./context/Expandable";

import classNames from "classnames";
import { createTestId } from "@/utils/testid";
import { useMe } from "@/contexts/CurrentCompanyContext";

interface GoalSelectorDropdownProps {
  goals: Goals.Goal[];
  selected: Goals.Goal | null | undefined;
  onSelect: (goal: Goals.Goal | null) => void;
  error?: boolean;
  allowCompanyWide?: boolean;
}

export function GoalSelectorDropdown(props: GoalSelectorDropdownProps) {
  const me = useMe();

  const options = {
    sortColumn: "name",
    sortDirection: "asc",
    showCompleted: false,
    showActive: true,
    showPaused: true,
    showGoals: true,
    showProjects: false,
    ownedBy: "anyone",
    reviewedBy: "anyone",
  } as TreeOptions;

  const tree = React.useMemo(() => buildTree(me!, props.goals, [], options), [props.goals, options]);

  const [open, setOpen] = React.useState(false);

  const handleSelect = (goal: Goals.Goal | null) => {
    setOpen(false);
    props.onSelect(goal);
  };

  return (
    <ExpandableProvider tree={tree}>
      <div className="relative">
        <div
          className={classNames("border px-3 py-1.5 rounded-lg flex items-center justify-between cursor-pointer", {
            "border-red-500": props.error,
            "border-surface-outline": !props.error,
          })}
          onClick={() => setOpen(!open)}
          data-test-id="goal-selector"
        >
          {props.selected ? (
            <div className="truncate flex items-center gap-1.5">
              <NodeIcon node={{ type: "goal" }} /> {props.selected.name}
            </div>
          ) : (
            <div className="text-content-dimmed">Select a goal &hellip;</div>
          )}
          <IconChevronDown size={20} />
        </div>

        {open && (
          <div className="absolute mt-1 w-full bg-surface-base border border-surface-outline rounded-lg shadow-lg z-50">
            {props.allowCompanyWide && (
              <div className="pl-4 pr-2">
                <CompanyGoalOption handleSelect={() => handleSelect(null)} />
              </div>
            )}

            {tree.map((root) => (
              <NodeView key={root.id} node={root as GoalNode} onSelect={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </ExpandableProvider>
  );
}

interface NodeProps {
  node: GoalNode;
  onSelect: (goal: Goals.Goal) => void;
  isFirstChild?: boolean;
}

function NodeView({ node, onSelect }: NodeProps) {
  return (
    <div>
      <TableRow className="px-2">
        <div
          className="inline-flex items-center gap-1.5 truncate flex-1 group pr-2"
          style={{ paddingLeft: node.depth * 30 }}
        >
          <NodeExpandCollapseToggle node={node} />
          <NodeIcon node={node as Node} />
          <div className="truncate">{node.name}</div>
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

  if (!node.hasChildren) return <div className="w-5" />;

  const handleClick = () => toggleExpanded(node.id);
  const size = 16;
  const ChevronIcon = expanded[node.id] ? IconChevronDown : IconChevronRight;

  const className = classNames("flex items-center flex-row-reverse gap-1 w-5");

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
