import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { Avatar, AvatarList } from "../Avatar";
import { IconCircleX, IconSearch, IconUser, IconUserPlus } from "../icons";
import { PersonField } from "../PersonField";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace AssigneesField {
  export type Person = PersonField.Person;
  export type SearchData = PersonField.SearchData;

  interface BaseProps {
    people: Person[];
    isOpen?: boolean;
    avatarSize?: number;
    size?: "small" | "normal";
    showTitle?: boolean;
    avatarOnly?: boolean;
    emptyStateMessage?: string;
    emptyStateReadOnlyMessage?: string;
    maxAvatars?: number;
    variant?: "inline" | "form-field";
    testId?: string;
    onOpenChange?: (isOpen: boolean) => void;
    onCloseAutoFocus?: (event: Event) => void;
  }

  interface ReadonlyProps extends BaseProps {
    readonly: true;
    searchData?: SearchData;
    setPeople?: (people: Person[]) => void;
  }

  interface EditableProps extends BaseProps {
    readonly?: boolean;
    searchData: SearchData;
    setPeople: (people: Person[]) => void;
  }

  export type Props = ReadonlyProps | EditableProps;
}

export function AssigneesField(props: AssigneesField.Props) {
  const state = useAssigneesFieldState(props);

  return (
    <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
      <Popover.Trigger
        className={calcTriggerClass(state)}
        data-test-id={state.testId}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !state.readonly) {
            e.preventDefault();
            state.setIsOpen(true);
          }
        }}
      >
        <TriggerIcon state={state} />
        <TriggerText state={state} />
      </Popover.Trigger>

      {!state.readonly && <Dialog state={state} />}
    </Popover.Root>
  );
}

interface State {
  people: AssigneesField.Person[];
  selectedIds: Set<string>;
  setPeople?: (people: AssigneesField.Person[]) => void;
  searchResults: AssigneesField.Person[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  readonly: boolean;
  avatarSize: number;
  size: "small" | "normal";
  showTitle: boolean;
  avatarOnly: boolean;
  emptyStateMessage: string;
  emptyStateReadOnlyMessage: string;
  maxAvatars: number;
  variant: "inline" | "form-field";
  testId: string;
  onCloseAutoFocus?: (event: Event) => void;
}

function useAssigneesFieldState(props: AssigneesField.Props): State {
  const isOpenControlled = props.isOpen !== undefined;
  const [internalIsOpen, changeOpen] = React.useState(!!props.isOpen);
  const [searchQuery, setSearchQuery] = React.useState("");

  const readonly = props.readonly ?? false;
  const resolvedBySize = props.size === "small" ? 24 : 32;
  const avatarSize = props.avatarSize ?? resolvedBySize;
  const isOpen = isOpenControlled ? !!props.isOpen : internalIsOpen;

  React.useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    const timerId = setTimeout(() => {
      props.searchData?.onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchQuery, isOpen]);

  const setIsOpen = (open: boolean) => {
    const nextOpen = readonly ? false : open;

    if (!isOpenControlled) {
      changeOpen(nextOpen);
    }

    props.onOpenChange?.(nextOpen);
  };

  const people = React.useMemo(() => sortPeopleByName(props.people), [props.people]);
  const selectedIds = React.useMemo(() => new Set(people.map((person) => person.id)), [people]);

  return {
    people,
    selectedIds,
    setPeople: props.setPeople,
    searchResults: (props.searchData?.people || []).filter((person) => !selectedIds.has(person.id)),
    searchQuery,
    setSearchQuery,
    isOpen,
    setIsOpen,
    readonly,
    avatarSize,
    size: props.size ?? "normal",
    showTitle: props.showTitle ?? true,
    avatarOnly: props.avatarOnly ?? false,
    emptyStateMessage: props.emptyStateMessage ?? "Assign task",
    emptyStateReadOnlyMessage: props.emptyStateReadOnlyMessage ?? "No assignees",
    maxAvatars: props.maxAvatars ?? 3,
    variant: props.variant ?? "inline",
    testId: props.testId || "assignees-field",
    onCloseAutoFocus: props.onCloseAutoFocus,
  };
}

function calcTriggerClass(state: State) {
  if (state.avatarOnly) {
    return classNames({
      "flex items-center justify-center": true,
      "focus:outline-none focus:ring-2 focus:ring-primary-base rounded-full": !state.readonly,
      "cursor-pointer": !state.readonly,
      "cursor-default": state.readonly,
      "ring-2 ring-surface-accent": state.isOpen,
    });
  }

  if (state.variant === "form-field") {
    return classNames({
      "flex items-center gap-2 truncate text-left": true,
      "w-full border border-stroke-base rounded-lg px-3 py-1.5 bg-surface-base": true,
      "focus:outline-none focus:ring-2 focus:ring-primary-base": !state.readonly,
      "cursor-pointer": !state.readonly,
      "cursor-default": state.readonly,
    });
  }

  return classNames({
    "flex items-center gap-2 truncate text-left": true,
    "focus:outline-none focus:ring-2 focus:ring-primary-base hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded":
      !state.readonly,
    "cursor-pointer": !state.readonly,
    "cursor-default": state.readonly,
    "bg-surface-dimmed": state.isOpen,
  });
}

function TriggerIcon({ state }: { state: State }) {
  if (state.people.length > 0) {
    return (
      <AvatarList
        people={state.people}
        size={state.avatarSize}
        stacked
        maxElements={state.maxAvatars}
        showCutOff
        wrap={false}
      />
    );
  }

  const Icon = state.readonly ? IconUser : IconUserPlus;

  return (
    <div
      className={classNames(
        "border border-content-subtle border-dashed rounded-full flex items-center justify-center",
        state.avatarOnly && !state.readonly
          ? "hover:border-content-accent hover:scale-105 transition-all duration-200"
          : undefined,
      )}
      style={{ width: state.avatarSize, height: state.avatarSize }}
    >
      <Icon className="text-content-dimmed" size={state.avatarSize * 0.5} />
    </div>
  );
}

function TriggerText({ state }: { state: State }) {
  if (state.avatarOnly) return null;

  if (state.people.length === 0) {
    return (
      <div className="truncate">
        <div className={(state.size === "small" ? "text-xs" : "text-sm") + " font-medium text-content-dimmed"}>
          {state.readonly ? state.emptyStateReadOnlyMessage : state.emptyStateMessage}
        </div>
      </div>
    );
  }

  const label = state.people.length === 1 ? state.people[0]!.fullName : `${state.people.length} assignees`;
  const title = state.people.map((person) => person.fullName).join(", ");

  return (
    <div className="-mt-0.5 truncate" title={title}>
      <div className={(state.size === "small" ? "text-xs" : "text-sm") + " font-medium truncate"}>{label}</div>
      {state.showTitle && state.people.length === 1 && state.people[0]!.title && (
        <div className="text-xs truncate">{state.people[0]!.title}</div>
      )}
    </div>
  );
}

function Dialog({ state }: { state: State }) {
  return (
    <Popover.Portal>
      <Popover.Content
        className="bg-surface-base shadow rounded border border-stroke-base p-0.5 z-[60]"
        style={{ width: 260 }}
        sideOffset={4}
        alignOffset={2}
        align="start"
        onCloseAutoFocus={state.onCloseAutoFocus}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            state.setIsOpen(false);
          }
        }}
      >
        <DialogContent state={state} />
      </Popover.Content>
    </Popover.Portal>
  );
}

function DialogContent({ state }: { state: State }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [state.searchResults]);

  const addPerson = (person: AssigneesField.Person) => {
    state.setPeople?.(sortPeopleByName([...state.people, person]));
    state.setSearchQuery("");
    state.setIsOpen(false);
  };

  const removePerson = (person: AssigneesField.Person) => {
    state.setPeople?.(sortPeopleByName(state.people.filter((selected) => selected.id !== person.id)));
  };

  const clearPeople = () => {
    state.setPeople?.([]);
    state.setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < state.searchResults.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        const selectedPerson = state.searchResults[selectedIndex];
        if (selectedPerson) addPerson(selectedPerson);
        break;
    }
  };

  return (
    <div className="p-1">
      {state.people.length > 0 && (
        <div className="p-1 pb-1 border-b border-stroke-base mb-1">
          <div className="space-y-0.5">
            {state.people.map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-2 rounded px-1 py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar person={person} size={18} />
                  <div className="text-sm truncate">{person.fullName}</div>
                </div>
                <button
                  type="button"
                  className="text-content-dimmed hover:text-content-base"
                  onClick={() => removePerson(person)}
                  data-test-id={createTestId(state.testId, "remove", person.fullName)}
                >
                  <IconCircleX size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-1 pb-0.5 relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-content-dimmed" size={14} />
        <input
          className="w-full border border-surface-outline rounded-lg pl-7 pr-2 py-1.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-base bg-surface-base text-content-base"
          placeholder="Search..."
          value={state.searchQuery}
          autoFocus
          onChange={(e) => state.setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="overflow-y-auto pt-0.5 pb-0.5" style={{ maxHeight: 210 }}>
        {state.searchResults.map((person, index) => (
          <div
            key={person.id}
            ref={(el) => (itemRefs.current[index] = el)}
            className={classNames("flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer text-content-base", {
              "bg-brand-1/10 text-content-accent ring-1 ring-inset ring-brand-1/20 dark:bg-brand-1/25 dark:ring-brand-1/40":
                index === selectedIndex,
              "hover:bg-surface-dimmed hover:text-content-accent": index !== selectedIndex,
            })}
            onClick={() => addPerson(person)}
            onMouseEnter={() => setSelectedIndex(index)}
            data-test-id={createTestId(state.testId, "search-result", person.fullName)}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Avatar person={person} size={18} />
              <div className="text-sm truncate">{person.fullName}</div>
            </div>
          </div>
        ))}
      </div>

      {state.people.length > 0 && (
        <button
          type="button"
          className="flex items-center gap-2 w-full px-1.5 py-1 rounded text-sm text-content-dimmed hover:text-content-base hover:bg-surface-dimmed"
          onClick={clearPeople}
          data-test-id={createTestId(state.testId, "clear")}
        >
          <IconCircleX size={14} />
          Clear assignees
        </button>
      )}
    </div>
  );
}

function sortPeopleByName(people: AssigneesField.Person[]): AssigneesField.Person[] {
  return [...people].sort((a, b) => a.fullName.localeCompare(b.fullName));
}
