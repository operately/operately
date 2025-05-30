import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconUser, IconUserPlus } from "@tabler/icons-react";
import { Avatar } from "../Avatar";

interface Person {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  title: string;
}

export interface PersonFieldProps {
  person: Person | null;
  avatarSize?: number;
  readonly?: boolean;
  showTitle?: boolean;
  emptyStateMessage?: string;
  emptyStateReadOnlyMessage?: string;
}

export interface State {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;

  person: Person | null;
  setPerson: (person: Person | null) => void;

  readonly: boolean;
  avatarSize: number;
  showTitle: boolean;
  emptyStateMessage: string;
  emptyStateReadOnlyMessage: string;
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
  const [isOpen, setIsOpen] = React.useState(false);
  const [person, setPerson] = React.useState<Person | null>(props.person ?? null);

  const readonly = props.readonly ?? false;
  const avatarSize = props.avatarSize ?? 32;
  const showTitle = props.showTitle ?? true;
  const emptyStateMessage = props.emptyStateMessage ?? "Select person";
  const emptyStateReadOnlyMessage = props.emptyStateReadOnlyMessage ?? "Not assigned";

  React.useEffect(() => {
    setPerson(props.person ?? null);
  }, [props.person]);

  return {
    isOpen,
    setIsOpen,
    person,
    setPerson,
    readonly,
    avatarSize,
    showTitle,
    emptyStateMessage,
    emptyStateReadOnlyMessage,
  };
}

function Trigger({ state }: { state: State }) {
  if (state.person) {
    return (
      <Popover.Trigger asChild>
        <div className="flex items-start gap-2 truncate">
          <Avatar person={state.person} size={state.avatarSize} />

          <div className="-mt-0.5 truncate">
            <div className="text-sm font-medium">{state.person.fullName}</div>
            {state.showTitle && <div className="text-xs truncate">{state.person.title}</div>}
          </div>
        </div>
      </Popover.Trigger>
    );
  } else {
    const Icon = state.readonly ? IconUser : IconUserPlus;

    return (
      <Popover.Trigger asChild>
        <div className="flex items-center gap-2 truncate">
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
        </div>
      </Popover.Trigger>
    );
  }
}

function Dialog({ state: _ }: { state: State }) {
  return null;
}

// function RegularState({ state }: { state: State }) {
//   return (
//   );
// }
