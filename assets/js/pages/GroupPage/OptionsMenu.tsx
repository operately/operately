import React from "react";

import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import { Link } from "react-router-dom";

export default ({ group }) => (
  <Popover.Root>
    <div className="max-w-md mx-auto z-50 relative">
      <Popover.Trigger asChild>
        <div className="mt-2 cursor-pointer">
          <div className="font-medium flex items-center gap-2 justify-center ">
            {React.createElement(Icons[group.icon], { size: 20, className: group.color, strokeWidth: 2 })}
            <div className="font-bold">{group.name}</div>
            <Icons.IconChevronDown size={20} className="text-content-accent" strokeWidth={2} />
          </div>

          <div className="text-center">
            <div className="text-content-dimmed text-sm">{group.mission}</div>
          </div>
        </div>
      </Popover.Trigger>
    </div>

    <Popover.Portal>
      <Popover.Content className="rounded p-5 bg-surface w-96 shadow" sideOffset={5}>
        <div className="uppercase text-xs text-center mb-4">{group.name} Space Settings</div>
        <div className="grid grid-cols-2 gap-4">
          <Option icon={Icons.IconId} label="Edit Name and Purpose" linkTo={`/groups/${group.id}/edit`} />
          <Option icon={Icons.IconUserPlus} label="Add/Remove Members" linkTo={`/groups/${group.id}/members`} />
          <Option icon={Icons.IconPaint} label="Change Appearance" linkTo={`/groups/${group.id}/appearance`} />
          <Option icon={Icons.IconLock} label="Change Visibility" linkTo={`/groups/${group.id}/visibility`} />
        </div>

        <Popover.Arrow className="fill-surface" width={20} height={10} offset={1} />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
);

function Option({ icon, label, linkTo }) {
  return (
    <Link to={linkTo}>
      <div className="flex flex-col gap-2 border border-stroke-base rounded py-4 px-4 items-center justify-center text-center bg-surface-accent hover:border-accent-1 cursor-pointer h-32">
        {React.createElement(icon, { size: 32, className: "text-content-accent", strokeWidth: 1 })}
        <div className="font-semibold text-sm">{label}</div>
      </div>
    </Link>
  );
}
