import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";

import Avatar from "@/components/Avatar";

export function Reviewer({ goal }) {
  return (
    <div className="mt-6">
      <div className="mb-2 uppercase text-xs font-bold tracking-wider">Reviewer</div>

      <div className="flex items-center gap-2">
        <Popover.Root>
          <Popover.Trigger>
            <div className="flex items-center gap-1.5 hover:bg-surface-highlight py-1 px-2 -mx-2 -my-1 cursor-pointer rounded">
              <Avatar person={goal.reviewer!} size={20} /> {goal.reviewer!.fullName}
            </div>
          </Popover.Trigger>

          <Popover.Content sideOffset={5} side="bottom" align="center">
            <Popover.Arrow className="text-surface-base" />

            <div className="bg-surface-base shadow-lg border border-surface-outline rounded-lg pb-4 w-64 relative">
              <Icons.IconX className="absolute top-4 right-4 cursor-pointer text-content-dimmed" size={14} />

              <div className="p-6 pb-4 flex items-center gap-3">
                <Avatar person={goal.reviewer!} size={64} />
                <div className="flex items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-bold">{goal.reviewer!.fullName}</div>
                      <div className="text-sm">{goal.reviewer!.title}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="">
                <div className="py-2 px-6 hover:bg-surface-highlight flex items-center gap-3 border-t border-stroke-base font-medium cursor-pointer">
                  Change reviewer
                </div>

                <div className="py-2 px-6 hover:bg-surface-highlight flex items-center gap-3 border-y border-stroke-base font-medium cursor-pointer">
                  View profile
                </div>
              </div>
            </div>
          </Popover.Content>
        </Popover.Root>
      </div>
    </div>
  );
}
