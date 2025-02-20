import * as React from "react";

import { Section } from "./Section";
import { useMe } from "@/contexts/CurrentCompanyContext";

import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import { SecondaryButton } from "@/components/Buttons";

export const DimmedLabel = ({ children }) => <div className="text-xs uppercase font-medium mb-1">{children}</div>;

export function Messages() {
  return (
    <div>
      <div className="mb-4 uppercase text-sm font-semibold tracking-wide mt-12">Conversations</div>

      <CheckIn status="On Track" color="bg-accent-1" />
      <Delays />
      <CheckIn status="Off Track" color="bg-red-500" />

      <div className="mt-2" />
      <SecondaryButton size="xs">Write a message</SecondaryButton>
    </div>
  );
}

function CheckIn({ status, color }) {
  const author = useMe()!;
  const avatar = <Avatar person={author} size={30} />;
  const statusClass = `${color} rounded-full px-1.5 py-0.5 text-[10px] uppercase font-semibold text-white-1`;

  return (
    <div className="flex items-start gap-3 pb-4">
      <div className="font-bold flex items-center gap-1 pt-1">{avatar}</div>

      <div>
        <div className="inline-flex items-center gap-2">
          <span className="font-bold">Progress Update</span>
          <div className={statusClass}>{status}</div>
        </div>

        <div className="text-sm mt-0.5">
          <span className="text-stone-500">
            <FormattedTime time={new Date()} format="long-date" />
          </span>
          <span className="mx-1 text-stone-500">&bull;</span>
          <span className="text-stone-500">John Smith</span>
          <span className="mx-1 text-stone-500">&bull;</span>
          Everything is going well. We are on track to meet our goals. We are working hard to make sure we are
          successful. Next week we will be meeting with the...
        </div>
      </div>
    </div>
  );
}

function Delays() {
  const author = useMe()!;
  const avatar = <Avatar person={author} size={30} />;

  return (
    <div className="flex items-start gap-3 pb-4">
      <div className="font-bold flex items-center gap-1 pt-1">{avatar}</div>

      <div>
        <div className="inline-flex items-center gap-2">
          <span className="font-bold">Delay</span>
          <div className="bg-orange-500 rounded-full px-1.5 py-0.5 text-[10px] uppercase font-semibold text-white-1">
            30 days added
          </div>
        </div>

        <div className="text-sm mt-0.5">
          <span className="text-stone-500">
            <FormattedTime time={new Date()} format="long-date" />
          </span>
          <span className="mx-1 text-stone-500">&bull;</span>
          <span className="text-stone-500">John Smith</span>
          <span className="mx-1 text-stone-500">&bull;</span>
          Everything is going well. We are on track to meet our goals. We are working hard to make sure we are
          successful. Next week we will be meeting with the...
        </div>
      </div>
    </div>
  );
}
