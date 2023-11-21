import React from "react";

import * as Icons from "@tabler/icons-react";
import Avatar from "@/components/Avatar";

import { ProjectContributor } from "@/gql/generated";

interface ContributorAvatarProps {
  contributor: ProjectContributor;
}

export default function ContributorAvatar(props: ContributorAvatarProps) {
  return (
    <div className={`shrink-0 relative ${borderClass(props.contributor.role)}`}>
      <Avatar person={props.contributor.person} />
    </div>
  );
}

function Badge({ role }) {
  switch (role) {
    case "champion":
      return (
        <div className="w-4 h-4 bg-dark-2 absolute -top-0.5 -left-1.5 flex items-center justify-center rounded-full">
          <Icons.IconCrown size={14} className="text-yellow-400" />
        </div>
      );
    case "reviewer":
      return (
        <div className="w-4 h-4 bg-dark-2 absolute -top-0.5 -left-1 flex items-center justify-center rounded-full">
          <Icons.IconEye size={14} className="text-sky-400" />
        </div>
      );

    default:
      return <div></div>;
  }
}

function borderClass(role: string) {
  switch (role) {
    case "champion":
      return "border border-yellow-400 rounded-full p-0.5 text-white-3";
    case "reviewer":
      return "border border-sky-400 rounded-full p-0.5 text-white-3";
    default:
      return "border border-white-3 rounded-full p-0.5 text-white-3";
  }
}

export function ChampionPlaceholder() {
  return (
    <div className={`shrink-0 relative ${borderClass("")} border-dashed`}>
      <Avatar person={null} />
      <Badge role="champion" />
    </div>
  );
}

export function ReviewerPlaceholder() {
  return (
    <div className={`shrink-0 relative ${borderClass("")} border-dashed`}>
      <Avatar person={null} />
      <Badge role="reviewer" />
    </div>
  );
}
