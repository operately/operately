import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { DateField } from "../DateField";
import FormattedTime from "../FormattedTime";
import { IconCircleX, IconExternalLink, IconFlag, IconSearch } from "../icons";
import { DivLink } from "../Link";
import classNames from "../utils/classnames";
import { createTestId, TestableElement } from "../TestableElement";

export interface Milestone {
  id: string;
  name: string;
  title?: string;
  dueDate?: DateField.ContextualDate | null;
  status?: string;
  hasDescription?: boolean;
  hasComments?: boolean;
  commentCount?: number;
  projectLink?: string;
  link?: string;
}

interface DialogMenuOptionProps {
  icon: React.ComponentType<{ size?: string | number; [key: string]: any }>;
  label: string;
  linkTo?: string;
  onClick?: () => void;
  testId?: string;
}

export interface MilestoneFieldProps extends TestableElement {
  milestone: Milestone | null;
  setMilestone: (milestone: Milestone | null) => void;

  isOpen?: boolean;
  readonly?: boolean;
  emptyStateMessage?: string;
  emptyStateReadOnlyMessage?: string;
  milestones: Milestone[];
  onSearch: (query: string) => Promise<void>;
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
  milestones: Milestone[];

  testId: string;
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
    if (!isOpen) return; // Don't search when dialog is closed

    // Debounce search by 300ms to avoid excessive API calls while typing
    const timerId = setTimeout(() => {
      props.onSearch(searchQuery);
    }, 300);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery, isOpen, props.onSearch]);

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
    milestones: props.milestones,

    testId: props.testId || "milestone-field",
  };
}

function Trigger({ state }: { state: State }) {
  const triggerClass = classNames({
    "flex items-center gap-2 truncate text-left w-full": true,
    "focus:outline-none focus:ring-2 focus:ring-primary-base hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded":
      !state.readonly,
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
        <div className="flex items-start gap-1.5 min-w-0" data-test-id={state.testId}>
          <IconFlag size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="truncate min-w-0">
            <div className="text-sm font-medium truncate">
              {state.milestone.name || state.milestone.title}
            </div>
            {state.milestone.dueDate?.date && (
              <div className="text-xs text-content-dimmed">
                Due <FormattedTime time={state.milestone.dueDate.date} format="short-date" />
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
        <div className="flex items-center gap-1.5 min-w-0" data-test-id={state.testId}>
          <div className="truncate min-w-0">
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
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            state.setIsOpen(false);
          }
        }}
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
      {state.milestone?.link && (
        <DialogMenuOption
          testId={createTestId(state.testId, "view-milestone")}
          icon={IconExternalLink}
          label="View milestone"
          linkTo={state.milestone.link}
        />
      )}

      {state.milestone?.projectLink && (
        <DialogMenuOption
          testId={createTestId(state.testId, "view-in-project")}
          icon={IconExternalLink}
          label="View in project"
          linkTo={state.milestone.projectLink}
        />
      )}

      <DialogMenuOption
        testId={createTestId(state.testId, "change-milestone")}
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
          testId={option.testId}
        />
      ))}

      <DialogMenuOption
        testId={createTestId(state.testId, "clear-milestone")}
        icon={IconCircleX}
        label="Clear milestone"
        onClick={() => {
          state.setMilestone(null);
          state.setIsOpen(false);
        }}
      />
    </div>
  );
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

function DialogSearch({ state }: { state: State }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);


  // Reset selected index when search results change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [state.milestones]);

  // Scroll selected item into view
  React.useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalOptions = state.milestones.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        const selectedMilestone = state.milestones[selectedIndex];
        if (selectedMilestone) {
          state.setMilestone(selectedMilestone);
          state.setSearchQuery(""); // Clear search query
          state.setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
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
        {state.milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            ref={(el) => (itemRefs.current[index] = el)}
            className={classNames("flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer", {
              "bg-surface-dimmed": index === selectedIndex,
              "hover:bg-surface-dimmed": index !== selectedIndex,
            })}
            onClick={() => {
              state.setMilestone(milestone);
              state.setSearchQuery(""); // Clear search query
              state.setIsOpen(false);
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            data-test-id={createTestId(state.testId, "search-result", milestone.name)}
          >
            <div className="flex items-start gap-1.5 truncate">
              <IconFlag size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div className="truncate">
                <div className="text-sm truncate">{milestone.name || milestone.title}</div>
                {milestone.dueDate?.date && (
                  <div className="text-xs text-content-dimmed">
                    Due <FormattedTime time={milestone.dueDate.date} format="short-date" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {state.milestones.length === 0 && state.searchQuery && (
          <div className="px-1.5 py-2 text-sm text-content-dimmed text-center">No milestones found</div>
        )}
      </div>
    </div>
  );
}
