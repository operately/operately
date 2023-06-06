import React from "react";
import * as Icons from "tabler-icons-react";

import Flare from "./Flare";
import Avatar, { AvatarSize } from "@/components/Avatar";

export default function Header({ project }): JSX.Element {
  return (
    <div className="py-16 bg-dark-1 relative">
      <Flare />

      <div className="flex items-center mb-4">
        <div className="text-sm bg-shade-1 rounded-full px-4 py-2 font-medium">
          &lt;&mdash; All Projects
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <div className="font-bold text-4xl">{project.name}</div>
        </div>

        <div className="flex items-center gap-2">
          <button className="rounded-lg hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium flex items-center gap-2">
            <Icons.Star size={16} className="text-yellow-400" />
            Follow
          </button>

          <button className="border border-white-3 rounded-lg hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium flex items-center gap-2 text-green-400 border-green-400">
            On Track
            <Icons.ChevronDown size={16} />
          </button>

          <button className="border border-white-3 rounded-lg hover:border-white-2 text-white-2 hover:text-white-1 px-3 py-1.5 text-sm font-medium flex items-center gap-2 text-pink-400 border-pink-400">
            <Icons.Hammer size={16} />
            Execution Phase
            <Icons.ChevronDown size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative border-2 rounded-full border-yellow-400 p-0.5">
          <Avatar person={project.owner} size={AvatarSize.Small} />
        </div>

        {project.contributors.map((c, index: number) => (
          <Avatar person={c.person} size={AvatarSize.Small} />
        ))}

        <div className="border border-white-3 border-dashed rounded-full p-1 text-white-3">
          <Icons.Plus />
        </div>
      </div>
    </div>
  );
}
