import * as React from "react";
import * as Icons from "@tabler/icons-react";
import Avatar from "@/components/Avatar";

import { ProjectContributor } from "@/models/projects";

interface ContributorAvatarProps {
  contributor: ProjectContributor;
}

export default function ContributorAvatar(props: ContributorAvatarProps) {
  return (
    <div className={`shrink-0 relative ${borderClass(props.contributor.role!)}`}>
      <Avatar person={props.contributor.person!} />
    </div>
  );
}

function borderClass(role: string) {
  switch (role) {
    case "champion":
      return "border border-yellow-500 rounded-full p-0.5 text-content-subtle";
    case "reviewer":
      return "border border-sky-500 rounded-full p-0.5 text-content-subtle";
    default:
      return "border border-surface-outline rounded-full p-0.5 text-content-subtle";
  }
}

export function ChampionPlaceholder() {
  return (
    <div className={`shrink-0 relative ${borderClass("")}`}>
      <div
        className="flex items-center justify-center bg-surface text-content-subtle rounded-full"
        style={{ width: 32, height: 32 }}
      >
        <Icons.IconUser size={24} className="text-content-subtle" stroke={1} />
      </div>
    </div>
  );
}

export function ReviewerPlaceholder() {
  return (
    <div className={`shrink-0 relative ${borderClass("")}`}>
      <div
        className="flex items-center justify-center bg-surface text-content-subtle rounded-full"
        style={{ width: 32, height: 32 }}
      >
        <Icons.IconUser size={24} className="text-content-subtle" stroke={1} />
      </div>
    </div>
  );
}
