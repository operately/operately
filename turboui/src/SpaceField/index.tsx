import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconBuildingSkyscraper, IconCircleX, IconSearch } from "@tabler/icons-react";
import { SecondaryButton } from "../Button";
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

    isOpen?: boolean;
    iconSize?: number;
    readonly?: boolean;

    emptyStateMessage?: string;
    emptyStateReadOnlyMessage?: string;
    searchSpaces: SearchSpaceFn;
    variant?: "inline" | "form-field";
  }

  export interface State extends Required<Props> {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;

    dialogMode: "menu" | "search";
    setDialogMode: (mode: "menu" | "search") => void;

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
  const [isOpen, setIsOpen] = React.useState(p.isOpen ?? DefaultProps.isOpen);
  const [dialogMode, setDialogMode] = React.useState<"menu" | "search">("menu");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SpaceField.Space[]>([]);

  React.useEffect(() => {
    if (dialogMode === "search" && searchQuery) {
      p.searchSpaces({ query: searchQuery }).then(setSearchResults);
    }
  }, [dialogMode, searchQuery]);

  return {
    ...DefaultProps,
    ...p,
    isOpen,
    setIsOpen,
    dialogMode,
    setDialogMode,
    searchQuery,
    setSearchQuery,
    searchResults,
  };
}

function Trigger({ state }: { state: SpaceField.State }) {
  if (!state.space && state.showEmptyStateAsButton) {
    return (
      <EmptyStateButton emptyStateText={state.emptyStateMessage} readonly={state.readonly} variant={state.variant} />
    );
  }

  const iconSize = state.iconSize;
  const Elem = state.readonly ? "span" : "button";

  const elemClass = classNames(
    {
      "flex items-center": true,
      "gap-1.5": true,
      "focus:outline-none hover:bg-surface-dimmed rounded-lg": !state.readonly,
      "px-1.5 py-1 -my-1 -mx-1.5": !state.readonly && state.variant === "inline",
      "px-2 py-1.5": state.variant === "form-field",
      "text-content-dimmed": !state.space,
      "w-full": state.variant === "form-field",
    },
    "text-sm",
  );

  const text = state.space
    ? state.space.name
    : state.readonly
    ? state.emptyStateReadonlyMessage
    : state.emptyStateMessage;

  return (
    <Elem className={elemClass}>
      <IconBuildingSkyscraper size={iconSize} className="-mt-[1px]" />
      <span>{text}</span>
    </Elem>
  );
}

function Dialog({ state }: { state: SpaceField.State }) {
  const content = (
    <div className="bg-surface-base shadow-lg border border-surface-outline rounded-md z-50 w-[300px]">
      <DialogMenu state={state} />
    </div>
  );

  return (
    <Popover.Portal>
      <Popover.Content className="z-50" sideOffset={5}>
        {content}
        <Popover.Arrow />
      </Popover.Content>
    </Popover.Portal>
  );
}

function DialogMenu({ state }: { state: SpaceField.State }) {
  if (state.dialogMode === "search") {
    return <SearchMode state={state} />;
  }

  return <MenuMode state={state} />;
}

function MenuMode({ state }: { state: SpaceField.State }) {
  return (
    <>
      <div className="flex justify-between items-center border-b border-surface-outline p-2 pb-1.5">
        <div className="text-sm font-medium">Space</div>
        {state.space && (
          <button
            onClick={() => state.setSpace(null)}
            className="flex items-center text-xs text-content-subtle px-2 py-1 rounded hover:bg-surface-dimmed"
          >
            <IconCircleX size={14} className="mr-1" />
            Clear
          </button>
        )}
      </div>
      <div className="p-2">
        <button
          onClick={() => state.setDialogMode("search")}
          className="text-left w-full text-sm px-2 py-1.5 rounded hover:bg-surface-dimmed flex items-center gap-2"
        >
          <IconSearch size={16} />
          <span>Search spaces...</span>
        </button>
      </div>
    </>
  );
}

function SearchMode({ state }: { state: SpaceField.State }) {
  return (
    <>
      <div className="p-2 border-b border-surface-outline">
        <input
          type="text"
          placeholder="Search spaces..."
          className="w-full px-2 py-1.5 bg-transparent border-none focus:outline-none text-sm"
          value={state.searchQuery}
          onChange={(e) => state.setSearchQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {state.searchResults.map((space) => (
          <SearchResult key={space.id} space={space} state={state} />
        ))}
      </div>
    </>
  );
}

function SearchResult({ space, state }: { space: SpaceField.Space; state: SpaceField.State }) {
  const handleSelect = () => {
    state.setSpace(space);
    state.setIsOpen(false);
    state.setDialogMode("menu");
    state.setSearchQuery("");
  };

  return (
    <button
      onClick={handleSelect}
      className="text-left w-full text-sm px-4 py-2 hover:bg-surface-dimmed flex items-center gap-2"
    >
      <IconBuildingSkyscraper size={16} />
      <span>{space.name}</span>
    </button>
  );
}

function EmptyStateButton({
  readonly,
  emptyStateText,
  variant,
}: {
  readonly: boolean;
  emptyStateText: string;
  variant?: "inline" | "form-field";
}) {
  if (readonly) {
    return null;
  } else {
    const containerClass = classNames({
      "text-content-subtle": true,
      "p-1.5": variant === "form-field",
      "w-full": variant === "form-field",
    });

    return (
      <div className={containerClass}>
        <SecondaryButton size="xs" icon={IconBuildingSkyscraper}>
          {emptyStateText}
        </SecondaryButton>
      </div>
    );
  }
}
