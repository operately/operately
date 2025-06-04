import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconCircleX, IconExternalLink, IconSearch } from "@tabler/icons-react";
import { DivLink } from "../Link";
import classNames from "../utils/classnames";

interface Goal {
  id: string;
  name: string;
  goalLink: string;
}

export interface PersonFieldProps {
  goal: Goal | null;
  setGoal: (person: Goal | null) => void;

  isOpen?: boolean;
  avatarSize?: number;
  readonly?: boolean;
  showTitle?: boolean;
  emptyStateMessage?: string;
  emptyStateReadOnlyMessage?: string;
  searchGoals: (params: { query: string }) => Promise<Goal[]>;
  extraDialogMenuOptions?: DialogMenuOptionProps[];
}

export interface State {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;

  dialogMode: "menu" | "search";
  setDialogMode: (mode: "menu" | "search") => void;

  goal: Goal | null;
  setGoal: (goal: Goal | null) => void;

  readonly: boolean;
  avatarSize: number;
  showTitle: boolean;
  emptyStateMessage: string;
  emptyStateReadOnlyMessage: string;
  extraDialogMenuOptions: DialogMenuOptionProps[];

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Goal[];
}

export function GoalField(props: PersonFieldProps) {
  const state = useState(props);

  return (
    <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
      <Trigger state={state} />
      <Dialog state={state} />
    </Popover.Root>
  );
}

export function useState(props: PersonFieldProps): State {
  const [isOpen, changeOpen] = React.useState(!!props.isOpen);
  const [dialogMode, setDialogMode] = React.useState<"menu" | "search">("menu");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Goal[]>([]);

  const readonly = props.readonly ?? false;
  const avatarSize = props.avatarSize ?? 32;
  const showTitle = props.showTitle ?? true;
  const emptyStateMessage = props.emptyStateMessage ?? "Select goal";
  const emptyStateReadOnlyMessage = props.emptyStateReadOnlyMessage ?? "No goal assigned";
  const extraDialogMenuOptions = props.extraDialogMenuOptions ?? [];

  React.useEffect(() => {
    if (!isOpen) {
      setIsOpen(false);
      setDialogMode(props.goal ? "menu" : "search");
    }
  }, [isOpen, props.goal]);

  React.useEffect(() => {
    let active = true;

    props.searchGoals({ query: searchQuery }).then((goals: Goal[]) => {
      if (active) {
        setSearchResults(goals);
      }
    });

    return () => {
      active = false;
    };
  }, [searchQuery, props.searchGoals]);

  const setIsOpen = (open: boolean) => {
    if (readonly) {
      changeOpen(false);
    } else {
      changeOpen(open);
    }
  };

  return {
    goal: props.goal,
    setGoal: props.setGoal,

    isOpen,
    setIsOpen,
    dialogMode,
    setDialogMode,
    readonly,
    avatarSize,
    showTitle,
    emptyStateMessage,
    emptyStateReadOnlyMessage,
    extraDialogMenuOptions,
    searchQuery,
    setSearchQuery,
    searchResults,
  };
}

function Trigger({ state }: { state: State }) {
  const triggerClass = classNames({
    "flex items-center gap-2 truncate text-left": true,
    "focus:outline-none hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded": !state.readonly,
    "cursor-pointer": !state.readonly,
    "cursor-default": state.readonly,
    "bg-surface-dimmed": state.isOpen,
  });

  if (state.goal) {
    return (
      <Popover.Trigger className={triggerClass}>
        {/* Replace Avatar with a goal icon or similar if needed */}
        <div
          className="border border-content-subtle rounded-full flex items-center justify-center bg-surface-dimmed"
          style={{
            width: state.avatarSize,
            height: state.avatarSize,
          }}
        >
          <IconExternalLink size={state.avatarSize * 0.5} />
        </div>

        <div className="-mt-0.5 truncate">
          <div className="text-sm font-medium">{state.goal.name}</div>
          {state.showTitle && <div className="text-xs truncate">{state.goal.goalLink}</div>}
        </div>
      </Popover.Trigger>
    );
  } else {
    return (
      <Popover.Trigger className={triggerClass}>
        <div
          className="border border-content-subtle border-dashed rounded-full flex items-center justify-center"
          style={{
            width: state.avatarSize,
            height: state.avatarSize,
          }}
        >
          <IconSearch className="text-content-dimmed" size={state.avatarSize * 0.5} />
        </div>

        <div className="truncate">
          <div className="text-sm font-medium text-content-dimmed">
            {state.readonly ? state.emptyStateReadOnlyMessage : state.emptyStateMessage}
          </div>
        </div>
      </Popover.Trigger>
    );
  }
}

function Dialog({ state }: { state: State }) {
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

function DialogMenu({ state }: { state: State }) {
  return (
    <div className="p-1">
      <DialogMenuOption icon={IconExternalLink} label="See goal" linkTo={state.goal?.goalLink || "#"} />
      <DialogMenuOption icon={IconSearch} label="Choose another goal" onClick={() => state.setDialogMode("search")} />

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
}

function DialogMenuOption({ icon, label, linkTo, onClick }: DialogMenuOptionProps) {
  const wrapperClass = "flex items-center gap-2 px-1 py-1 rounded hover:bg-surface-dimmed cursor-pointer";
  const Icon = icon;

  const content = (
    <div className="flex items-center text-sm gap-2">
      <Icon size={14} />
      {label}
    </div>
  );

  if (linkTo) {
    return <DivLink className={wrapperClass} to={linkTo} children={content} />;
  } else if (onClick) {
    return <div className={wrapperClass} onClick={onClick} children={content} />;
  } else {
    throw new Error("Either linkTo or onClick must be provided");
  }
}

function DialogSearch({ state }: { state: State }) {
  return (
    <div className="p-1">
      <div className="p-1 pb-0.5">
        <input
          className="w-full border border-stroke-base rounded px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
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
              {/* Replace Avatar with a goal icon or similar if needed */}
              <IconExternalLink size={18} />
              <div className="text-sm truncate">{goal.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
