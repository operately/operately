import * as React from "react";
import { Link } from "react-router-dom";
import * as Icons from "@tabler/icons-react";
import * as Groups from "@/graphql/Groups";

export function SpaceCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-4 justify-center">{children}</div>;
}

interface SpaceCardProps {
  group: Groups.Group;
  commingSoon?: boolean;
}

export function SpaceCardOption(props: SpaceCardProps) {
  const { name, mission, color, icon, privateSpace } = props.group;
  const commingSoon = props.commingSoon ?? false;
  const iconElement = Icons[icon];

  return (
    <div
      className="px-4 py-3 bg-surface rounded-lg cursor-pointer hover:shadow transition-shadow border border-surface-outline relative w-64"
      title={name}
    >
      {commingSoon && (
        <div className="uppercase text-[10px] bg-surface-dimmed text-content-dimmed mt-1 inline-block px-1 py-0.5 tracking-wider">
          Comming Soon
        </div>
      )}

      <div className="mt-2"></div>
      {React.createElement(iconElement, { size: 40, className: color, strokeWidth: 1 })}
      <div className="font-semibold mt-2">{name}</div>
      <div className="text-content-dimmed text-xs line-clamp-2">{mission}</div>

      {privateSpace && (
        <div className="absolute top-2 right-2 text-accent-1">
          <Icons.IconLock size={24} />
        </div>
      )}
    </div>
  );
}

export function SpaceCardLink({ group, commingSoon }: { group: Groups.Group; commingSoon?: boolean }) {
  const { name, mission, color, icon } = group;
  const privateSpace = group.privateSpace!; // TODO: Fix this
  const iconElement = Icons[icon];

  return (
    <Link
      className="px-4 py-3 bg-surface rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow border border-surface-outline relative w-64"
      title={name}
      to={`/spaces/${group.id}`}
    >
      {commingSoon && (
        <div className="uppercase text-[10px] bg-surface-dimmed text-content-dimmed mt-1 inline-block px-1 py-0.5 tracking-wider">
          Comming Soon
        </div>
      )}

      <div className="mt-2"></div>
      {React.createElement(iconElement, { size: 40, className: color, strokeWidth: 1 })}
      <div className="font-semibold mt-2">{name}</div>
      <div className="text-content-dimmed text-xs line-clamp-2">{mission}</div>

      {privateSpace && (
        <div className="absolute top-2 right-2 text-accent-1">
          <Icons.IconLock size={24} />
        </div>
      )}
    </Link>
  );
}
