import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { SecondaryButton } from "@/components/Buttons";

import AvatarList from "@/components/AvatarList";
import classNames from "classnames";
import Avatar from "@/components/Avatar";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { IconCheck } from "@tabler/icons-react";

export function WhoToNotify({ subscriptionsState }) {
  return (
    <div>
      <div className="font-bold mb-1">When I post this, notify:</div>

      <div className="flex items-center gap-2">
        <AvatarList
          people={subscriptionsState.subscribers.map((s: any) => s.person!)}
          size={30}
          stacked
          stackSpacing={"-space-x-1"}
        />

        <AddRemoveButton />
      </div>
    </div>
  );
}

const menuContentClass = classNames(
  "relative rounded-md mt-1 z-10 px-1 py-1.5",
  "shadow-xl ring-1 transition ring-surface-outline",
  "focus:outline-none",
  "bg-surface-base",
  "animateMenuSlideDown",
);

function SelectablePerson({ person, isChecked }) {
  return (
    <DropdownMenu.Item asChild>
      <div className="px-1.5 py-1 hover:bg-surface-highlight cursor-pointer rounded">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Avatar size={18} person={person} />
            <div>
              <div className="text-sm font-medium">{person.fullName}</div>
            </div>
          </div>

          <div className={isChecked ? "opacity-100" : "opacity-0"}>
            <IconCheck size={14} />
          </div>
        </div>
      </div>
    </DropdownMenu.Item>
  );
}

function AddRemoveButton() {
  const trigger = <SecondaryButton size="xs">Add/Remove</SecondaryButton>;

  const content = (
    <div>
      <input
        type="text"
        placeholder="Search..."
        className="w-full px-2 py-1 bg-surface-base text-sm border-none outline-none ring-0"
        autoFocus
      />
      <div className="border-t border-stroke-base mb-1" />
      <SelectablePerson isChecked={true} person={{ fullName: "John Doe" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "Jane Perkins" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "Steve Smith" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "Stefan Petrov" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "Anna Johnson" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "Maria Lopez" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "Kate Kowalski" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "Alexei Ivanov" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "John Doe" }} />
      <SelectablePerson isChecked={true} person={{ fullName: "Jane Perkins" }} />
    </div>
  );

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={menuContentClass} align="start" sideOffset={5}>
          {content}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
