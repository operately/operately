import React from "react";
import * as Icons from "tabler-icons-react";

import Flare from "./Flare";
import Avatar, { AvatarSize } from "@/components/Avatar";

import { Link } from "react-router-dom";

export default function Header({ project }): JSX.Element {
  return (
    <div className="pt-12 pb-8 relative">
      <div className="text-center text-5xl font-bold max-w-2xl mx-auto">
        {project.name}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 cursor-pointer">
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
