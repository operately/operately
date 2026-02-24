import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconChevronDown, IconCircleX, IconProjectPlain, IconSearch } from "../icons";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace ProjectField {
  export interface Project {
    id: string;
    name: string;
    link: string;
  }

  export type SearchProjectFn = (params: { query: string }) => Promise<Project[]>;

  export interface Props {
    project: Project | null;
    setProject: (project: Project | null) => void;
    search: SearchProjectFn;

    isOpen?: boolean;
    iconSize?: number;
    readonly?: boolean;

    emptyStateMessage?: string;
    emptyStateReadOnlyMessage?: string;
    variant?: "inline" | "form-field";
    testId?: string;
    showIcon?: boolean;
    label?: string;
    error?: string;
  }

  export interface State extends Required<Omit<Props, "label" | "error">> {
    label: string;
    error: string;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;

    dialogMode: "menu" | "search";
    setDialogMode: (mode: "menu" | "search") => void;
    closeDialog: () => void;

    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: Project[];
  }
}

const DefaultProps = {
  isOpen: false,
  iconSize: 20,
  readonly: false,
  emptyStateMessage: "Select project",
  emptyStateReadOnlyMessage: "No project selected",
  variant: "inline",
  testId: "project-field",
  showIcon: true,
} as const;

export function ProjectField(props: ProjectField.Props) {
  const state = useProjectFieldState(props);

  const containerClass = state.variant === "form-field" ? "w-full" : undefined;

  return (
    <div className={containerClass} >
      {state.label && <label className="font-bold text-sm mb-1 block text-left">{state.label}</label>}
      <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
        <Popover.Anchor asChild>
          <div className="w-full">
            <Trigger state={state} />
          </div>
        </Popover.Anchor>
        <Dialog state={state} />
      </Popover.Root>
      {state.error && <div className="text-red-500 text-xs mt-1 mb-1">{state.error}</div>}
    </div>
  );
}

export function useProjectFieldState(p: ProjectField.Props): ProjectField.State {
  const initialMode = p.variant === "form-field" ? "search" : "menu";

  const [isOpen, setIsOpen] = React.useState(p.isOpen ?? DefaultProps.isOpen);
  const [dialogMode, setDialogMode] = React.useState<"menu" | "search">(initialMode);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<ProjectField.Project[]>([]);

  React.useEffect(() => {
    if (dialogMode === "search") {
      p.search({ query: searchQuery }).then(setSearchResults);
    }
  }, [dialogMode, searchQuery, p.search]);

  const closeDialog = React.useCallback(() => {
    setIsOpen(false);
    setDialogMode(initialMode);
    setSearchQuery("");
  }, [initialMode]);

  return {
    ...DefaultProps,
    ...p,
    label: p.label || "",
    error: p.error || "",
    isOpen,
    setIsOpen,
    dialogMode,
    closeDialog,
    setDialogMode,
    searchQuery,
    setSearchQuery,
    searchResults,
  };
}

function Trigger({ state }: { state: ProjectField.State }) {
  const iconSize = state.iconSize;

  const elemClass = classNames(
    {
      "flex items-center justify-between": true,
      "gap-1.5": true,
      "focus:outline-none hover:bg-surface-dimmed rounded-lg": !state.readonly,
      "px-1.5 py-1 -my-1 -mx-1.5": !state.readonly && state.variant === "inline",
      "px-2 py-1.5 border rounded-lg": state.variant === "form-field",
      "border-surface-outline": state.variant === "form-field" && !state.error,
      "border-red-500 outline-red-500": state.variant === "form-field" && !!state.error,
      "text-content-dimmed": !state.project,
      "w-full": state.variant === "form-field",
      "cursor-pointer": !state.readonly,
    },
    "text-sm",
  );

  const text = getProjectFieldText(state);

  return (
    <Popover.Trigger asChild disabled={state.readonly} data-test-id={state.testId}>
      <button type="button" className={elemClass} aria-label={text}>
        <div className="flex items-center gap-1.5 flex-grow min-w-0">
          {state.showIcon && <IconProjectPlain size={iconSize} className="-mt-[1px] flex-shrink-0" />}
          <span className="truncate">{text}</span>
        </div>
        {state.variant === "form-field" && <IconChevronDown size={16} className="text-content-subtle flex-shrink-0" />}
      </button>
    </Popover.Trigger>
  );
}

function getProjectFieldText(state: ProjectField.State) {
  if (state.project) return state.project.name;
  if (state.readonly) return state.emptyStateReadOnlyMessage;

  return state.emptyStateMessage;
}

function Dialog({ state }: { state: ProjectField.State }) {
  return (
    <Popover.Portal>
      <Popover.Content
        className="bg-surface-base shadow rounded border border-stroke-base p-0.5 z-50 w-[var(--radix-popover-trigger-width)]"
        sideOffset={4}
        align="start"
        alignOffset={0}
      >
        <DialogMenu state={state} />
        <Popover.Arrow className="fill-surface-base stroke-1 stroke-surface-outline" />
      </Popover.Content>
    </Popover.Portal>
  );
}

function DialogMenu({ state }: { state: ProjectField.State }) {
  if (state.variant === "form-field") {
    return <SearchMode state={state} />;
  }

  if (state.dialogMode === "search") {
    return <SearchMode state={state} />;
  }

  return <MenuMode state={state} />;
}

function MenuMode({ state }: { state: ProjectField.State }) {
  const commonButtonClass =
    "flex items-center gap-2 text-sm w-full text-left px-1 py-1 rounded hover:bg-surface-dimmed cursor-pointer";

  return (
    <div className="p-1">
      {state.project && (
        <button
          onClick={() => {
            state.setProject(null);
            state.setIsOpen(false);
          }}
          className={classNames(commonButtonClass)}
        >
          <IconCircleX size={14} />
          <span>Clear project</span>
        </button>
      )}
      <button
        onClick={() => state.setDialogMode("search")}
        className={classNames(commonButtonClass, state.project ? "mt-1" : "")}
      >
        <IconSearch size={14} />
        <span>Choose another project</span>
      </button>
    </div>
  );
}

function SearchMode({ state }: { state: ProjectField.State }) {
  return (
    <div className="p-1">
      <div className="p-1 pb-0.5">
        <input
          type="text"
          placeholder="Search projects..."
          className="w-full border border-surface-outline rounded px-2 py-1 text-sm focus:outline-none focus:ring-0 text-content-base bg-surface-base"
          value={state.searchQuery}
          onChange={(e) => state.setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="overflow-y-auto pt-0.5 pb-0.5" style={{ maxHeight: "210px" }}>
        {state.searchResults.length === 0 && state.searchQuery && (
          <div className="px-1.5 py-1 text-sm text-content-dimmed">No projects found.</div>
        )}
        {state.searchResults.map((project) => (
          <SearchResult key={project.id} project={project} state={state} />
        ))}
      </div>
    </div>
  );
}

function SearchResult({ project, state }: { project: ProjectField.Project; state: ProjectField.State }) {
  const handleSelect = () => {
    state.setProject(project);
    state.closeDialog();
  };

  return (
    <button
      onClick={handleSelect}
      className="text-left w-full text-sm px-1.5 py-1 rounded hover:bg-surface-dimmed flex items-center gap-2 cursor-pointer"
      data-test-id={createTestId(state.testId, "search-result", project.name)}
    >
      <IconProjectPlain size={14} />
      <span>{project.name}</span>
    </button>
  );
}
