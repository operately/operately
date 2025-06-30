import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconCircleX, IconExternalLink, IconSearch, IconFlag, IconPlus } from "../icons";
import { DivLink } from "../Link";
import FormattedTime from "../FormattedTime";
import classNames from "../utils/classnames";

export interface Milestone {
  id: string;
  name?: string;
  title?: string;
  dueDate?: Date;
  status?: string;
  hasDescription?: boolean;
  hasComments?: boolean;
  commentCount?: number;
  projectLink?: string;
}

export interface MilestoneFieldProps {
  milestone: Milestone | null;
  setMilestone: (milestone: Milestone | null) => void;

  isOpen?: boolean;
  readonly?: boolean;
  emptyStateMessage?: string;
  emptyStateReadOnlyMessage?: string;
  searchMilestones: (params: { query: string }) => Promise<Milestone[]>;
  onCreateNew?: (title?: string) => void;
  extraDialogMenuOptions?: DialogMenuOptionProps[];
}

export interface State {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;

  dialogMode: "menu" | "search";
  setDialogMode: (mode: "menu" | "search") => void;

  milestone: Milestone | null;
  setMilestone: (milestone: Milestone | null) => void;

  readonly: boolean;
  emptyStateMessage: string;
  emptyStateReadOnlyMessage: string;
  extraDialogMenuOptions: DialogMenuOptionProps[];

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Milestone[];
  onCreateNew?: (title?: string) => void;
}

export function MilestoneField(props: MilestoneFieldProps) {
  const state = useState(props);

  return (
    <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
      <Trigger state={state} />
      <Dialog state={state} />
    </Popover.Root>
  );
}

export function useState(props: MilestoneFieldProps): State {
  const [isOpen, changeOpen] = React.useState(!!props.isOpen);
  const [dialogMode, setDialogMode] = React.useState<"menu" | "search">("menu");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Milestone[]>([]);

  const readonly = props.readonly ?? false;
  const emptyStateMessage = props.emptyStateMessage ?? "Select milestone";
  const emptyStateReadOnlyMessage = props.emptyStateReadOnlyMessage ?? "No milestone";
  const extraDialogMenuOptions = props.extraDialogMenuOptions ?? [];

  React.useEffect(() => {
    if (!isOpen) {
      setDialogMode(props.milestone ? "menu" : "search");
      setSearchQuery(""); // Clear search query when dialog closes
    }
  }, [isOpen, props.milestone]);

  React.useEffect(() => {
    let active = true;

    props.searchMilestones({ query: searchQuery }).then((milestones: Milestone[]) => {
      if (active) {
        setSearchResults(milestones);
      }
    });

    return () => {
      active = false;
    };
  }, [searchQuery, props.searchMilestones]);

  const setIsOpen = (open: boolean) => {
    if (readonly) {
      changeOpen(false);
    } else {
      changeOpen(open);
    }
  };

  return {
    milestone: props.milestone,
    setMilestone: props.setMilestone,

    isOpen,
    setIsOpen,
    dialogMode,
    setDialogMode,
    readonly,
    emptyStateMessage,
    emptyStateReadOnlyMessage,
    extraDialogMenuOptions,
    searchQuery,
    setSearchQuery,
    searchResults,
    onCreateNew: props.onCreateNew,
  };
}

function Trigger({ state }: { state: State }) {
  const triggerClass = classNames({
    "flex items-center gap-2 truncate text-left": true,
    "focus:outline-none focus:ring-2 focus:ring-primary-base hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded": !state.readonly,
    "cursor-pointer": !state.readonly,
    "cursor-default": state.readonly,
    "bg-surface-dimmed": state.isOpen,
  });

  if (state.milestone) {
    return (
      <Popover.Trigger 
        className={triggerClass}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !state.readonly) {
            e.preventDefault();
            state.setIsOpen(true);
          }
        }}
      >
        <div className="flex items-start gap-1.5">
          <IconFlag size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="truncate">
            <div className="text-sm font-medium">{state.milestone.name || state.milestone.title}</div>
            {state.milestone.dueDate && (
              <div className="text-xs text-content-dimmed">
                Due <FormattedTime time={state.milestone.dueDate} format="short-date" />
              </div>
            )}
          </div>
        </div>
      </Popover.Trigger>
    );
  } else {
    return (
      <Popover.Trigger 
        className={triggerClass}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !state.readonly) {
            e.preventDefault();
            state.setIsOpen(true);
          }
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="truncate">
            <div className="text-sm font-medium text-content-dimmed">
              {state.readonly ? state.emptyStateReadOnlyMessage : state.emptyStateMessage}
            </div>
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
        className="bg-surface-base shadow rounded border border-stroke-base p-0.5 z-[60]"
        style={{ width: 240 }}
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
      {state.milestone?.projectLink && (
        <DialogMenuOption
          icon={IconExternalLink}
          label="View in project"
          linkTo={state.milestone.projectLink}
        />
      )}

      <DialogMenuOption
        icon={IconSearch}
        label="Choose different milestone"
        onClick={() => {
          state.setSearchQuery(""); // Clear any previous search
          state.setDialogMode("search");
        }}
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
        icon={IconCircleX}
        label="Clear milestone"
        onClick={() => {
          state.setMilestone(null);
          state.setIsOpen(false);
        }}
        danger={true}
      />
    </div>
  );
}

interface DialogMenuOptionProps {
  icon: React.ComponentType<{ size?: string | number; [key: string]: any }>;
  label: string;
  linkTo?: string;
  onClick?: () => void;
  danger?: boolean;
}

function DialogMenuOption({ icon, label, linkTo, onClick, danger = false }: DialogMenuOptionProps) {
  const wrapperClass = classNames(
    "flex items-center gap-2 px-1 py-1 rounded cursor-pointer",
    {
      "hover:bg-surface-dimmed": !danger,
      "hover:bg-red-50 hover:text-red-600": danger,
    }
  );
  const Icon = icon;

  const content = (
    <div className={classNames("flex items-center text-sm gap-2", {
      "text-content-base": !danger,
      "text-content-base hover:text-red-600": danger,
    })}>
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
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Reset selected index when search results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [state.searchResults]);

  // Scroll selected item into view
  React.useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hasCreateOption = state.searchResults.length === 0 && state.searchQuery && state.onCreateNew;
    const totalOptions = state.searchResults.length + (hasCreateOption ? 1 : 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < totalOptions - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (hasCreateOption && selectedIndex === 0) {
          // Create new milestone with search query
          if (state.onCreateNew) {
            state.onCreateNew(state.searchQuery);
            state.setIsOpen(false);
          }
        } else {
          // Select existing milestone
          const selectedMilestone = state.searchResults[selectedIndex];
          if (selectedMilestone) {
            state.setMilestone(selectedMilestone);
            state.setSearchQuery(""); // Clear search query
            state.setIsOpen(false);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        state.setIsOpen(false);
        break;
    }
  };

  return (
    <div className="p-1">
      <div className="p-1 pb-0.5">
        <input
          className="w-full border border-surface-outline rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-base bg-surface-base text-content-base"
          placeholder="Find or create milestone..."
          value={state.searchQuery}
          autoFocus
          onChange={(e) => state.setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="overflow-y-auto pt-0.5 pb-0.5" style={{ maxHeight: 210 }}>
        {state.searchResults.map((milestone, index) => (
          <div
            key={milestone.id}
            ref={(el) => (itemRefs.current[index] = el)}
            className={classNames(
              "flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer",
              {
                "bg-surface-dimmed": index === selectedIndex,
                "hover:bg-surface-dimmed": index !== selectedIndex,
              }
            )}
            onClick={() => {
              state.setMilestone(milestone);
              state.setSearchQuery(""); // Clear search query
              state.setIsOpen(false);
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-start gap-1.5 truncate">
              <IconFlag size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="truncate">
                <div className="text-sm truncate">{milestone.name || milestone.title}</div>
                {milestone.dueDate && (
                  <div className="text-xs text-content-dimmed">
                    Due <FormattedTime time={milestone.dueDate} format="short-date" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {state.searchResults.length === 0 && state.searchQuery && state.onCreateNew && (
          <div
            ref={(el) => (itemRefs.current[0] = el)}
            className={classNames(
              "flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer",
              {
                "bg-surface-dimmed": selectedIndex === 0,
                "hover:bg-surface-dimmed": selectedIndex !== 0,
              }
            )}
            onClick={() => {
              if (state.onCreateNew) {
                state.onCreateNew(state.searchQuery);
                state.setIsOpen(false);
              }
            }}
            onMouseEnter={() => setSelectedIndex(0)}
          >
            <div className="flex items-center gap-1.5 truncate">
              <IconPlus size={18} className="text-content-dimmed shrink-0" />
              <div className="truncate">
                <div className="text-sm truncate">
                  Create "<span className="font-medium">{state.searchQuery}</span>"
                </div>
              </div>
            </div>
          </div>
        )}

        {state.searchResults.length === 0 && state.searchQuery && !state.onCreateNew && (
          <div className="px-1.5 py-2 text-sm text-content-dimmed text-center">
            No milestones found
          </div>
        )}
      </div>
    </div>
  );
}