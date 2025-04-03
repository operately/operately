import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { GhostButton } from "@/components/Buttons";
import classNames from "classnames";

export function ZeroState() {
  return (
    <div>
      <Examples />
      <ExplanationAndButton />
    </div>
  );
}

function ExplanationAndButton() {
  return (
    <div className="flex flex-col justify-center items-center group">
      <div className="text-base font-bold">Discussions</div>

      <div className="flex gap-2 mt-1 mb-4 text-center px-6 text-sm">
        Post announcements, pitch ideas, and discuss ideas with your team.
      </div>

      <GhostButton size="sm">Write a new post</GhostButton>
    </div>
  );
}

function Examples() {
  return (
    <div className="relative w-full h-[170px] mt-10 opacity-75 px-[65px] flex flex-col gap-3">
      <Example icon={Icons.IconSpeakerphone} title="Post Announcements" body="We have a new team member..." />
      <Example icon={Icons.IconBulb} title="Pitch Ideas" body="I have an idea to expand..." />
      <Example icon={Icons.IconMessage} title="Discuss ideas" body="We need to make a decision..." />
    </div>
  );
}

function Example({ icon, title, body }: { icon: any; title: string; body: string }) {
  const iconClass = classNames(
    "bg-stone-300",
    "group-hover:bg-yellow-300",
    "group-hover:text-stone-900",
    "dark:bg-stone-600",
    "dark:group-hover:bg-yellow-500",
    "rounded-full p-1.5 transition-all",
  );

  return (
    <div className="flex items-center gap-2 group-hover:gap-3 transition-all shadow-sm pb-2">
      <div className={iconClass}>{React.createElement(icon, { size: 22, stroke: 1.5 })}</div>
      <div>
        <div className="font-bold text-[10px] leading-none">{title}</div>
        <div className="text-[10px]">{body}</div>
      </div>
    </div>
  );
}
