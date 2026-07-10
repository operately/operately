import * as React from "react";

import { PrimaryButton } from "../Button";
import { IconBuildingEstate, IconChevronDown, IconChevronRight, IconGoalPlain } from "../icons";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";
import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { SelectGoalGoal, SelectGoalProps } from "./types";
import { useValidation, validatePresence } from "./validation";

const DEFAULT_VALIDATION_PROPS = {
  required: true,
};

interface GoalTreeNode {
  goal: SelectGoalGoal;
  children: GoalTreeNode[];
  depth: number;
}

export function SelectGoal(props: SelectGoalProps) {
  const { field, label, goals, required } = { ...DEFAULT_VALIDATION_PROPS, ...props };
  const [value, setValue] = useFieldValue<SelectGoalGoal | null>(field);
  const error = useFieldError(field);

  useValidation(field, validatePresence(required));

  return (
    <InputField field={field} label={label} error={error}>
      <GoalSelectorDropdown
        selected={value}
        goals={goals}
        onSelect={setValue}
        error={!!error}
        allowCompanyWide={props.allowCompanyWide}
      />
    </InputField>
  );
}

interface GoalSelectorDropdownProps {
  goals: SelectGoalGoal[];
  selected: SelectGoalGoal | null | undefined;
  onSelect: (goal: SelectGoalGoal | null) => void;
  error?: boolean;
  allowCompanyWide?: boolean;
}

function GoalSelectorDropdown(props: GoalSelectorDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const tree = React.useMemo(() => buildGoalTree(props.goals), [props.goals]);

  const handleSelect = (goal: SelectGoalGoal | null) => {
    setOpen(false);
    props.onSelect(goal);
  };

  const toggleExpanded = (id: string) => {
    setExpanded((current) => ({ ...current, [id]: !current[id] }));
  };

  return (
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
            <IconGoalPlain size={16} /> {props.selected.name}
          </div>
        ) : (
          <div className="text-content-dimmed">Select a goal &hellip;</div>
        )}
        <IconChevronDown size={20} />
      </div>

      {open && (
        <div className="absolute mt-1 w-full bg-surface-base border border-surface-outline rounded-lg shadow-lg z-50">
          {props.allowCompanyWide && (
            <div className="px-2 py-1.5 border-b border-stroke-base">
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <IconBuildingEstate size={16} />
                  <span>Company-wide goal</span>
                </div>
                <PrimaryButton onClick={() => handleSelect(null)} size="xxs" testId="select-company-wide-option">
                  Select
                </PrimaryButton>
              </div>
            </div>
          )}

          {tree.map((node) => (
            <GoalNodeView
              key={node.goal.id}
              node={node}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalNodeView({
  node,
  expanded,
  toggleExpanded,
  onSelect,
}: {
  node: GoalTreeNode;
  expanded: Record<string, boolean>;
  toggleExpanded: (id: string) => void;
  onSelect: (goal: SelectGoalGoal) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = Boolean(expanded[node.goal.id]);

  return (
    <div>
      <div className="px-2 py-1.5 flex items-center justify-between gap-2 hover:bg-surface-dimmed">
        <div
          className="inline-flex items-center gap-1.5 truncate flex-1"
          style={{ paddingLeft: node.depth * 24 }}
        >
          <ExpandToggle
            hasChildren={hasChildren}
            isExpanded={isExpanded}
            onToggle={() => toggleExpanded(node.goal.id)}
          />
          <IconGoalPlain size={16} />
          <div className="truncate">{node.goal.name}</div>
          {hasChildren && !isExpanded ? (
            <div className="text-xs text-content-dimmed shrink-0">
              {node.children.length} {node.children.length === 1 ? "subgoal" : "subgoals"}
            </div>
          ) : null}
        </div>

        <PrimaryButton
          onClick={() => onSelect(node.goal)}
          size="xxs"
          testId={createTestId("goal", node.goal.name)}
        >
          Select
        </PrimaryButton>
      </div>

      {hasChildren && isExpanded
        ? node.children.map((child) => (
            <GoalNodeView
              key={child.goal.id}
              node={child}
              expanded={expanded}
              toggleExpanded={toggleExpanded}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

function ExpandToggle({
  hasChildren,
  isExpanded,
  onToggle,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  if (!hasChildren) return <div className="w-4" />;

  const ChevronIcon = isExpanded ? IconChevronDown : IconChevronRight;

  return (
    <button type="button" className="w-4 flex items-center justify-center" onClick={onToggle}>
      <ChevronIcon size={14} />
    </button>
  );
}

function buildGoalTree(goals: SelectGoalGoal[]): GoalTreeNode[] {
  const activeGoals = goals.filter((goal) => !goal.isClosed && !goal.isArchived);
  const byId = new Map(activeGoals.map((goal) => [goal.id, goal]));
  const childrenByParent = new Map<string | null, SelectGoalGoal[]>();

  activeGoals.forEach((goal) => {
    const parentId = goal.parentGoalId && byId.has(goal.parentGoalId) ? goal.parentGoalId : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(goal);
    childrenByParent.set(parentId, siblings);
  });

  const sortByName = (a: SelectGoalGoal, b: SelectGoalGoal) => a.name.localeCompare(b.name);

  const buildNodes = (parentId: string | null, depth: number): GoalTreeNode[] => {
    const children = (childrenByParent.get(parentId) ?? []).slice().sort(sortByName);

    return children.map((goal) => ({
      goal,
      depth,
      children: buildNodes(goal.id, depth + 1),
    }));
  };

  return buildNodes(null, 0);
}
