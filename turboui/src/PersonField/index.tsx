import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconCircleX, IconExternalLink, IconSearch, IconUser, IconUserPlus } from "../icons";
import { Avatar } from "../Avatar";
import { DivLink } from "../Link";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";

export namespace PersonField {
  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    title?: string;
    profileLink?: string;
  }

  export interface Props {
    person: Person | null;
    setPerson: (person: Person | null) => void;

    isOpen?: boolean;
    avatarSize?: number;
    readonly?: boolean;
    showTitle?: boolean;
    avatarOnly?: boolean;
    emptyStateMessage?: string;
    emptyStateReadOnlyMessage?: string;
    searchPeople: (params: { query: string }) => Promise<Person[]>;
    extraDialogMenuOptions?: DialogMenuOptionProps[];
    testId?: string;
  }

  export interface State {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;

    dialogMode: "menu" | "search";
    setDialogMode: (mode: "menu" | "search") => void;

    person: Person | null;
    setPerson: (person: Person | null) => void;

    readonly: boolean;
    avatarSize: number;
    showTitle: boolean;
    avatarOnly: boolean;
    emptyStateMessage: string;
    emptyStateReadOnlyMessage: string;
    extraDialogMenuOptions: DialogMenuOptionProps[];

    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: Person[];
    testId: string;
  }
}

export function PersonField(props: PersonField.Props) {
  const state = useState(props);

  return (
    <Popover.Root open={state.isOpen} onOpenChange={state.setIsOpen}>
      <Trigger state={state} />
      <Dialog state={state} />
    </Popover.Root>
  );
}

export function useState(props: PersonField.Props): PersonField.State {
  const [isOpen, changeOpen] = React.useState(!!props.isOpen);
  const [dialogMode, setDialogMode] = React.useState<"menu" | "search">("menu");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<PersonField.Person[]>([]);

  const readonly = props.readonly ?? false;
  const avatarSize = props.avatarSize ?? 32;
  const showTitle = props.showTitle ?? true;
  const avatarOnly = props.avatarOnly ?? false;
  const emptyStateMessage = props.emptyStateMessage ?? "Select person";
  const emptyStateReadOnlyMessage = props.emptyStateReadOnlyMessage ?? "Not assigned";
  const extraDialogMenuOptions = props.extraDialogMenuOptions ?? [];

  React.useEffect(() => {
    if (!isOpen) {
      setIsOpen(false);
      setDialogMode(props.person ? "menu" : "search");
      setSearchQuery(""); // Clear search query when dialog closes
    }
  }, [isOpen, props.person]);

  React.useEffect(() => {
    let active = true;

    props.searchPeople({ query: searchQuery }).then((people: PersonField.Person[]) => {
      if (active) {
        setSearchResults(people);
      }
    });

    return () => {
      active = false;
    };
  }, [searchQuery, props.searchPeople]);

  const setIsOpen = (open: boolean) => {
    if (readonly) {
      changeOpen(false);
    } else {
      changeOpen(open);
    }
  };

  return {
    person: props.person,
    setPerson: props.setPerson,

    isOpen,
    setIsOpen,
    dialogMode,
    setDialogMode,
    readonly,
    avatarSize,
    showTitle,
    avatarOnly,
    emptyStateMessage,
    emptyStateReadOnlyMessage,
    extraDialogMenuOptions,
    searchQuery,
    setSearchQuery,
    searchResults,

    testId: props.testId || "person-field",
  };
}

function Trigger({ state }: { state: PersonField.State }) {
  const triggerContent = (
    <>
      <TriggerIcon state={state} />
      <TriggerText state={state} />
    </>
  );

  if (state.readonly && state.person && state.person.profileLink) {
    return (
      <DivLink to={state.person.profileLink} className={calcTriggerClass(state)} testId={state.testId}>
        {triggerContent}
      </DivLink>
    );
  } else {
    return (
      <Popover.Trigger className={calcTriggerClass(state)} data-test-id={state.testId}>
        {triggerContent}
      </Popover.Trigger>
    );
  }
}

function calcTriggerClass(state: PersonField.State) {
  const hasClickableProfile = state.readonly && state.person && state.person.profileLink;
  
  if (state.avatarOnly) {
    return classNames({
      "flex items-center justify-center": true,
      "focus:outline-none rounded-full": !state.readonly,
      "cursor-pointer": !state.readonly || hasClickableProfile,
      "cursor-default": state.readonly && !hasClickableProfile,
      "ring-2 ring-surface-accent": state.isOpen,
    });
  } else {
    return classNames({
      "flex items-center gap-2 truncate text-left": true,
      "focus:outline-none hover:bg-surface-dimmed px-1.5 py-1 -my-1 -mx-1.5 rounded": !state.readonly,
      "cursor-pointer": !state.readonly || hasClickableProfile,
      "cursor-default": state.readonly && !hasClickableProfile,
      "bg-surface-dimmed": state.isOpen,
    });
  }
}

function TriggerIcon({ state }: { state: PersonField.State }) {
  if (state.person) {
    return (
      <Avatar
        person={state.person!}
        size={state.avatarSize}
        className={classNames({
          "transition-all duration-200": state.avatarOnly && !state.readonly,
          "hover:scale-105 hover:shadow-md": state.avatarOnly && !state.readonly,
        })}
      />
    );
  } else {
    const Icon = state.readonly ? IconUser : IconUserPlus;

    return (
      <div
        className={classNames({
          "border border-content-subtle border-dashed rounded-full flex items-center justify-center": true,
          "hover:border-content-accent transition-all duration-200": state.avatarOnly && !state.readonly,
          "hover:scale-105": state.avatarOnly && !state.readonly,
        })}
        style={{
          width: state.avatarSize,
          height: state.avatarSize,
        }}
      >
        <Icon className="text-content-dimmed" size={state.avatarSize * 0.5} />
      </div>
    );
  }
}

function TriggerText({ state }: { state: PersonField.State }) {
  if (state.avatarOnly) return null;

  if (state.person) {
    return (
      <div className="-mt-0.5 truncate">
        <div className="text-sm font-medium">{state.person.fullName}</div>
        {state.showTitle && state.person.title && <div className="text-xs truncate">{state.person.title}</div>}
      </div>
    );
  } else {
    return (
      <div className="truncate">
        <div className="text-sm font-medium text-content-dimmed">
          {state.readonly ? state.emptyStateReadOnlyMessage : state.emptyStateMessage}
        </div>
      </div>
    );
  }
}

function Dialog({ state }: { state: PersonField.State }) {
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

function DialogMenu({ state }: { state: PersonField.State }) {
  return (
    <div className="p-1">
      <DialogMenuOption
        testId={`${state.testId}-view-profile`}
        icon={IconExternalLink}
        label="See profile"
        linkTo={state.person?.profileLink || "#"}
      />

      <DialogMenuOption
        testId={`${state.testId}-assign-another`}
        icon={IconSearch}
        label="Choose someone else"
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
        testId={`${state.testId}-clear-assignment`}
        icon={IconCircleX}
        label="Clear assignment"
        onClick={() => {
          state.setPerson(null);
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

function DialogSearch({ state }: { state: PersonField.State }) {
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
        if (selectedPerson) {
          state.setPerson(selectedPerson);
          state.setSearchQuery(""); // Clear search query
          state.setIsOpen(false);
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
          className="w-full border border-surface-outline rounded px-2 py-1 text-sm focus:outline-none focus:ring-0 text-content-base bg-surface-base"
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
            className={classNames("flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer", {
              "bg-surface-dimmed": index === selectedIndex,
              "hover:bg-surface-dimmed": index !== selectedIndex,
            })}
            onClick={() => {
              state.setPerson(person);
              state.setSearchQuery(""); // Clear search query
              state.setIsOpen(false);
            }}
            onMouseEnter={() => setSelectedIndex(index)}
            data-test-id={createTestId(state.testId, `search-result`, person.fullName)}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Avatar person={person} size={18} />
              <div className="text-sm truncate">{person.fullName}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
