import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import { IconQuestionMark } from "@tabler/icons-react";
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
}

export interface State {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;

  person: Person | null;
  setPerson: (person: Person | null) => void;

  readonly: boolean;
  avatarSize: number;
  showTitle: boolean;
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
    return (
      <Popover.Trigger asChild>
        <div className="flex items-start gap-2 truncate">
          <div className="bg-yellow-500/10 rounded-full h-[32px] w-[32px] flex items-center justify-center">
            <IconQuestionMark className="text-yellow-800" size={20} />
          </div>

          <div className="-mt-0.5 truncate">
            <div className="text-sm font-medium">{role}</div>
            <div className="text-xs truncate">{description}</div>
          </div>
        </div>
      </Popover.Trigger>
    );
  }
}

function Dialog({ state }: { state: State }) {
  return null;
}

// function RegularState({ state }: { state: State }) {
//   return (
//   );
// }
