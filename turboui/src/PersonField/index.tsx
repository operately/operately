import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconCircleX, IconExternalLink, IconSearch, IconUser, IconUserPlus } from "@tabler/icons-react";
import { Avatar, AvatarWithName } from "../Avatar";
import { DivLink } from "../Link";
import classNames from "../utils/classnames";

interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  title: string;

  profileLink: string;
}

export interface PersonFieldProps {
  person: Person | null;
  isOpen?: boolean;
  avatarSize?: number;
  readonly?: boolean;
  showTitle?: boolean;
  emptyStateMessage?: string;
  emptyStateReadOnlyMessage?: string;
  searchPeople: (query: string) => Promise<Person[]>;
  extraDialogMenuOptions?: DialogMenuOptionProps[];
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
  emptyStateMessage: string;
  emptyStateReadOnlyMessage: string;
  extraDialogMenuOptions: DialogMenuOptionProps[];

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Person[];
}

export function PersonField(props: PersonFieldProps) {
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
  const [person, setPerson] = React.useState<Person | null>(props.person ?? null);
  const [dialogMode, setDialogMode] = React.useState<"menu" | "search">("menu");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Person[]>([]);

  const readonly = props.readonly ?? false;
  const avatarSize = props.avatarSize ?? 32;
  const showTitle = props.showTitle ?? true;
  const emptyStateMessage = props.emptyStateMessage ?? "Select person";
  const emptyStateReadOnlyMessage = props.emptyStateReadOnlyMessage ?? "Not assigned";
  const extraDialogMenuOptions = props.extraDialogMenuOptions ?? [];

  React.useEffect(() => {
    setPerson(props.person ?? null);
  }, [props.person]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsOpen(false);
      setDialogMode(person ? "menu" : "search");
    }
  }, [isOpen, person]);

  React.useEffect(() => {
    let active = true;

    props.searchPeople(searchQuery).then((people: Person[]) => {
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
    isOpen,
    setIsOpen,
    dialogMode,
    setDialogMode,
    person,
    setPerson,
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

  if (state.person) {
    return (
      <Popover.Trigger className={triggerClass}>
        <Avatar person={state.person} size={state.avatarSize} />

        <div className="-mt-0.5 truncate">
          <div className="text-sm font-medium">{state.person.fullName}</div>
          {state.showTitle && <div className="text-xs truncate">{state.person.title}</div>}
        </div>
      </Popover.Trigger>
    );
  } else {
    const Icon = state.readonly ? IconUser : IconUserPlus;

    return (
      <Popover.Trigger className={triggerClass}>
        <div
          className="border border-content-subtle border-dashed rounded-full flex items-center justify-center"
          style={{
            width: state.avatarSize,
            height: state.avatarSize,
          }}
        >
          <Icon className="text-content-dimmed" size={state.avatarSize * 0.5} />
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
      <DialogMenuOption icon={IconExternalLink} label="See profile" linkTo={state.person?.profileLink || "#"} />
      <DialogMenuOption icon={IconSearch} label="Choose someone else" onClick={() => state.setDialogMode("search")} />

      {state.extraDialogMenuOptions.map((option, index) => (
        <DialogMenuOption
          key={index}
          icon={option.icon}
          label={option.label}
          onClick={option.onClick}
          linkTo={option.linkTo}
        />
      ))}

      <DialogMenuOption
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
          placeholder="Search..."
          value={state.searchQuery}
          autoFocus
          onChange={(e) => state.setSearchQuery(e.target.value)}
        />
      </div>

      <div className="overflow-y-auto pt-0.5 pb-0.5" style={{ maxHeight: 300 }}>
        {state.searchResults.map((person) => (
          <div
            key={person.id}
            className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-surface-dimmed cursor-pointer"
            onClick={() => {
              state.setPerson(person);
              state.setIsOpen(false);
            }}
          >
            <AvatarWithName person={person} size={18} className="text-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
