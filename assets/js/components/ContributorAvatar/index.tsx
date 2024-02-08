import * as React from "react";
import * as Icons from "@tabler/icons-react";
import Avatar from "@/components/Avatar";

import { ProjectContributor } from "@/gql/generated";

interface ContributorAvatarProps {
  contributor: ProjectContributor;
  size?: number;
}

export default function ContributorAvatar(props: ContributorAvatarProps) {
  return (
    <div className={`shrink-0 relative ${borderClass(props.contributor.role)}`}>
      <Avatar person={props.contributor.person} size={props.size} />
    </div>
  );
}

function borderClass(role: string) {
  return "";
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
