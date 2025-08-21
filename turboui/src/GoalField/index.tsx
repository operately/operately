import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconCircleX, IconExternalLink, IconSearch } from "../icons";
import { IconGoal } from "../icons";
import { DivLink } from "../Link";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace GoalField {
  export interface Goal {
    id: string;
    name: string;
    link: string;
  }

  export type SearchGoalFn = (params: { query: string }) => Promise<Goal[]>;

  export interface Props {
    goal: Goal | null;
    setGoal: (goal: Goal | null) => void;

    isOpen?: boolean;
    iconSize?: number;
    readonly?: boolean;

    emptyStateMessage?: string;
    emptyStateReadOnlyMessage?: string;
    searchGoals: SearchGoalFn;
    extraDialogMenuOptions?: DialogMenuOptionProps[];
    testId?: string;
  }

  //
  // The state interface is used to manage the internal state of the GoalField component.
  // It includes all the properties from Props, along with additional state management functions.
  //
  export interface State extends Required<Props> {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;

    dialogMode: "menu" | "search";
    setDialogMode: (mode: "menu" | "search") => void;

    goal: Goal | null;
    setGoal: (goal: Goal | null) => void;

    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: Goal[];
  }
}

export function GoalField(props: GoalField.Props) {
  const state = useGoalFieldState(props);

  return (
    <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
      <Trigger state={state} />
      <Dialog state={state} />
    </Popover.Root>
  );
}

const DefaultProps = {
  isOpen: false,
  iconSize: 20,
  readonly: false,
  emptyStateMessage: "Select a goal",
  emptyStateReadOnlyMessage: "No goal selected",
  extraDialogMenuOptions: [],
};

export function useGoalFieldState(p: GoalField.Props): GoalField.State {
  const props = { ...DefaultProps, ...p };

  const [isOpen, changeOpen] = React.useState(!!props.isOpen);
  const [dialogMode, setDialogMode] = React.useState<"menu" | "search">("menu");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<GoalField.Goal[]>([]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsOpen(false);
      setDialogMode(props.goal ? "menu" : "search");
    }
  }, [isOpen, props.goal]);

  React.useEffect(() => {
    if (!isOpen || dialogMode !== "search") return;

    props.searchGoals({ query: searchQuery }).then((goals: GoalField.Goal[]) => {
      setSearchResults(goals);
    });
  }, [searchQuery, props.searchGoals, isOpen, dialogMode]);

  const setIsOpen = (open: boolean) => {
    if (props.readonly) {
      changeOpen(false);
    } else {
      changeOpen(open);
    }
  };

  return {
    ...props,

    isOpen,
    setIsOpen,
    dialogMode,
    setDialogMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    testId: props.testId || "goal-field",
  };
}

function Trigger({ state }: { state: GoalField.State }) {
  const triggerClass = classNames({
    "flex items-center gap-2 truncate text-left": true,
    "focus:outline-none hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded": !state.readonly,
    "cursor-pointer": !state.readonly || (state.readonly && state.goal),
    "cursor-default": state.readonly && !state.goal,
    "bg-surface-dimmed": state.isOpen,
  });

  if (state.goal) {
    const goalContent = (
      <>
        <IconGoal size={state.iconSize} />
        <div className="text-sm font-medium truncate">{state.goal.name}</div>
      </>
    );

    if (state.readonly) {
      return (
        <DivLink to={state.goal.link} className={triggerClass} testId={state.testId}>
          {goalContent}
        </DivLink>
      );
    } else {
      return (
        <Popover.Trigger className={triggerClass} data-test-id={state.testId}>
          {goalContent}
        </Popover.Trigger>
      );
    }
  } else {
    return (
      <Popover.Trigger className={triggerClass}>
        <div className="truncate">
          <div className="text-sm font-medium text-content-dimmed">
            {state.readonly ? state.emptyStateReadOnlyMessage : state.emptyStateMessage}
          </div>
        </div>
      </Popover.Trigger>
    );
  }
}

function Dialog({ state }: { state: GoalField.State }) {
  if (state.readonly) return null;

  return (
    <Popover.Portal>
      <Popover.Content
        className="bg-surface-base shadow rounded border border-stroke-base p-0.5"
        style={{ width: 220 }}
        sideOffset={4}
        alignOffset={2}
        align="start"
      >
        {state.dialogMode === "menu" && <DialogMenu state={state} />}
        {state.dialogMode === "search" && <DialogSearch state={state} />}
      </Popover.Content>
    </Popover.Portal>
  );
}

function DialogMenu({ state }: { state: GoalField.State }) {
  return (
    <div className="p-1">
      <DialogMenuOption
        testId={`${state.testId}-view-goal`}
        icon={IconExternalLink}
        label="See goal"
        linkTo={state.goal?.link || "#"}
      />

      <DialogMenuOption
        testId={`${state.testId}-search`}
        icon={IconSearch}
        label="Choose another goal"
        onClick={() => state.setDialogMode("search")}
      />

      {state.extraDialogMenuOptions.map((option, index) => (
        <DialogMenuOption
          key={index}
          icon={option.icon}
          label={option.label}
          onClick={() => {
            option.onClick && option.onClick();
            state.setIsOpen(false);
          }}
          linkTo={option.linkTo}
        />
      ))}

      <DialogMenuOption
        testId={`${state.testId}-clear`}
        icon={IconCircleX}
        label="Clear goal"
        onClick={() => {
          state.setGoal(null);
          state.setIsOpen(false);
        }}
      />
    </div>
  );
}

interface DialogMenuOptionProps {
  icon: React.ComponentType<{ size?: string | number; [key: string]: any }>;
  label: string;
  linkTo?: string;
  onClick?: () => void;
  testId?: string;
}

function DialogMenuOption({ icon, label, linkTo, onClick, testId }: DialogMenuOptionProps) {
  const wrapperClass = "flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-dimmed cursor-pointer";
  const Icon = icon;

  const content = (
    <div className="flex items-center text-sm gap-2">
      <Icon size={14} />
      {label}
    </div>
  );

  if (linkTo) {
    return <DivLink className={wrapperClass} to={linkTo} children={content} testId={testId} />;
  } else if (onClick) {
    return <div className={wrapperClass} onClick={onClick} children={content} data-test-id={testId} />;
  } else {
    throw new Error("Either linkTo or onClick must be provided");
  }
}

function DialogSearch({ state }: { state: GoalField.State }) {
  return (
    <div className="p-1">
      <div className="p-1 pb-0.5">
        <input
          className="w-full border border-surface-outline rounded px-2 py-1 text-sm focus:outline-none focus:ring-0 text-content-base bg-surface-base"
          placeholder="Search goals..."
          value={state.searchQuery}
          autoFocus
          onChange={(e) => state.setSearchQuery(e.target.value)}
        />
      </div>

      <div className="overflow-y-auto pt-0.5 pb-0.5" style={{ maxHeight: 210 }}>
        {state.searchResults.map((goal) => (
          <div
            key={goal.id}
            className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-surface-dimmed cursor-pointer"
            onClick={() => {
              state.setGoal(goal);
              state.setIsOpen(false);
            }}
          >
            <div className="flex items-center gap-1.5 truncate">
              <div className="text-sm truncate" data-test-id={createTestId(state.testId, goal.name)}>
                {goal.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
