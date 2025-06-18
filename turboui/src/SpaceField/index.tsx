import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconChevronDown, IconCircleX, IconSearch, IconTent } from "@tabler/icons-react";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace SpaceField {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export type SearchSpaceFn = (params: { query: string }) => Promise<Space[]>;

  export interface Props {
    space: Space | null;
    setSpace: (space: Space | null) => void;
    search: SearchSpaceFn;

    isOpen?: boolean;
    iconSize?: number;
    readonly?: boolean;

    emptyStateMessage?: string;
    emptyStateReadOnlyMessage?: string;
    variant?: "inline" | "form-field";
    testId?: string;
  }

  export interface State extends Required<Props> {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;

    dialogMode: "menu" | "search";
    setDialogMode: (mode: "menu" | "search") => void;
    closeDialog: () => void;

    space: Space | null;
    setSpace: (space: Space | null) => void;

    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: Space[];
  }
}

const DefaultProps = {
  isOpen: false,
  iconSize: 20,
  readonly: false,
  emptyStateMessage: "Select space",
  emptyStateReadOnlyMessage: "No space selected",
  variant: "inline",
  testId: "space-field",
} as const;

export function SpaceField(props: SpaceField.Props) {
  const state = useSpaceFieldState(props);

  return (
    <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
      <Trigger state={state} />
      <Dialog state={state} />
    </Popover.Root>
  );
}

export function useSpaceFieldState(p: SpaceField.Props): SpaceField.State {
  const initialMode = p.variant === "form-field" ? "search" : "menu";

  const [isOpen, setIsOpen] = React.useState(p.isOpen ?? DefaultProps.isOpen);
  const [dialogMode, setDialogMode] = React.useState<"menu" | "search">(initialMode);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SpaceField.Space[]>([]);

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

function Trigger({ state }: { state: SpaceField.State }) {
  const iconSize = state.iconSize;

  const elemClass = classNames(
    {
      "flex items-center justify-between": true, // Added justify-between for chevron alignment
      "gap-1.5": true,
      "focus:outline-none hover:bg-surface-dimmed rounded-lg": !state.readonly,
      "px-1.5 py-1 -my-1 -mx-1.5": !state.readonly && state.variant === "inline",
      "px-2 py-1.5 border border-surface-outline rounded-lg": state.variant === "form-field", // Added border for form-field
      "text-content-dimmed": !state.space,
      "w-full": state.variant === "form-field",
      "cursor-pointer": !state.readonly, // Added cursor-pointer when not readonly
    },
    "text-sm",
  );

  const text = getSpaceFieldText(state);

  return (
    <Popover.Trigger asChild disabled={state.readonly} data-test-id={state.testId}>
      <button type="button" className={elemClass} aria-label={text}>
        <div className="flex items-center gap-1.5 flex-grow">
          <IconTent size={iconSize} className="-mt-[1px]" />
          <span>{text}</span>
        </div>
        {state.variant === "form-field" && <IconChevronDown size={16} className="text-content-subtle" />}
      </button>
    </Popover.Trigger>
  );
}

function getSpaceFieldText(state: SpaceField.State) {
  if (state.space) return state.space.name;
  if (state.readonly) return state.emptyStateReadOnlyMessage;

  return state.emptyStateMessage;
}

function Dialog({ state }: { state: SpaceField.State }) {
  return (
    <Popover.Portal>
      <Popover.Content
        className="bg-surface-base shadow rounded border border-stroke-base p-0.5 z-50"
        style={{ width: "220px" }}
        sideOffset={4}
        align="start"
        alignOffset={2}
      >
        <DialogMenu state={state} />
        <Popover.Arrow className="fill-surface-base stroke-1 stroke-surface-outline" />
      </Popover.Content>
    </Popover.Portal>
  );
}

function DialogMenu({ state }: { state: SpaceField.State }) {
  // If variant is form-field, always show SearchMode.
  if (state.variant === "form-field") {
    return <SearchMode state={state} />;
  }

  // For inline variant, behavior depends on dialogMode.
  if (state.dialogMode === "search") {
    return <SearchMode state={state} />;
  }

  return <MenuMode state={state} />;
}

function MenuMode({ state }: { state: SpaceField.State }) {
  const commonButtonClass =
    "flex items-center gap-2 text-sm w-full text-left px-1 py-1 rounded hover:bg-surface-dimmed cursor-pointer";

  return (
    <div className="p-1">
      {state.space && (
        <button
          onClick={() => {
            state.setSpace(null);
            state.setIsOpen(false); // Close dialog after clearing
          }}
          className={classNames(commonButtonClass)}
        >
          <IconCircleX size={14} />
          <span>Clear space</span>
        </button>
      )}
      <button
        onClick={() => state.setDialogMode("search")}
        className={classNames(commonButtonClass, state.space ? "mt-1" : "")} // Add margin if clear button is present
      >
        <IconSearch size={14} />
        <span>Choose another space</span>
      </button>
    </div>
  );
}

function SearchMode({ state }: { state: SpaceField.State }) {
  return (
    <div className="p-1">
      <div className="p-1 pb-0.5">
        <input
          type="text"
          placeholder="Search spaces..."
          className="w-full border border-stroke-base rounded px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none"
          value={state.searchQuery}
          onChange={(e) => state.setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="overflow-y-auto pt-0.5 pb-0.5" style={{ maxHeight: "210px" }}>
        {state.searchResults.length === 0 && state.searchQuery && (
          <div className="px-1.5 py-1 text-sm text-content-dimmed">No spaces found.</div>
        )}
        {state.searchResults.map((space) => (
          <SearchResult key={space.id} space={space} state={state} />
        ))}
      </div>
    </div>
  );
}

function SearchResult({ space, state }: { space: SpaceField.Space; state: SpaceField.State }) {
  const handleSelect = () => {
    state.setSpace(space);
    state.closeDialog();
  };

  return (
    <button
      onClick={handleSelect}
      className="text-left w-full text-sm px-1.5 py-1 rounded hover:bg-surface-dimmed flex items-center gap-2 cursor-pointer"
      data-test-id={createTestId(state.testId, "search-result", space.name)}
    >
      <IconTent size={14} />
      <span>{space.name}</span>
    </button>
  );
}
