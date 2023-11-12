import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Groups from "@/graphql/Groups";
import * as Pages from "@/components/Pages";

import client from "@/graphql/client";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { GhostButton } from "@/components/Button";

interface LoaderData {
  groups: Groups.Group[];
}

export async function loader(): Promise<LoaderData> {
  const groupData = await client.query({
    query: Groups.LIST_GROUPS,
  });

  return {
    groups: groupData.data.groups,
  };
}

export function Page() {
  const [{ groups }] = Paper.useLoadedData() as [LoaderData];

  return (
    <Pages.Page title="Lobby">
      <div className="font-medium flex items-center gap-2 w-full justify-center mt-3">
        <Icons.IconPlant2 size={20} className="text-accent-1" strokeWidth={2} />
        Lobby &middot; Choose a Space to get started
        <Icons.IconChevronDown size={20} className="text-content-accent" strokeWidth={2} />
      </div>

      <Paper.Root size="large">
        <div className="flex justify-center gap-4 pt-16 flex-wrap">
          <div className="relative w-64 px-4 py-3">
            <div className="font-bold">Welcome Back!</div>
            <div className="text-sm mt-4">
              You are in the lobby of Operately. This is where you can find all the spaces you are a part of.
            </div>
          </div>

          <SpaceCard
            name="Company Space"
            icon={Icons.IconBuildingEstate}
            color={"text-cyan-500"}
            desctiption="Everyone in the company"
            privateSpace={false}
            linkTo="/groups"
          />
          <SpaceCard
            name="Personal Space"
            icon={Icons.IconTrees}
            color={"text-green-500"}
            desctiption="Your own private space in Operately"
            privateSpace={true}
            linkTo="/groups"
          />
          <div></div>
        </div>

        <div className="flex items-center justify-center mt-8">
          <div className="flex-1 mx-4 border-t border-surface-outline"></div>

          <GhostButton testId="add-group" linkTo="/groups/new" type="primary">
            Add a new Space
          </GhostButton>

          <div className="flex-1 mx-4 border-t border-surface-outline"></div>
        </div>

        <GroupList groups={groups} />
      </Paper.Root>
    </Pages.Page>
  );
}

function SpaceCard({
  name,
  desctiption,
  privateSpace,
  color,
  icon,
  linkTo,
}: {
  name: string;
  desctiption: string;
  privateSpace: boolean;
  color: string;
  icon: React.FC<{ size: number; className: string; strokeWidth: number }>;
  linkTo: string;
}) {
  const onClick = useNavigateTo(linkTo);

  return (
    <div
      className="px-4 py-3 bg-surface rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow border border-surface-outline relative w-64"
      onClick={onClick}
    >
      <div className="mt-2"></div>
      {React.createElement(icon, { size: 40, className: "text-content-dimmed" + " " + color, strokeWidth: 1 })}
      <div className="font-semibold mt-2">{name}</div>
      <div className="text-content-dimmed text-xs">{desctiption}</div>

      {privateSpace && (
        <div className="absolute top-2 right-2 text-accent-1">
          <Icons.IconLock size={24} />
        </div>
      )}
    </div>
  );
}

function GroupList({ groups }: { groups: Groups.Group[] }) {
  const colors = ["text-orange-500", "text-cyan-500", "text-purple-500", "text-blue-500", "text-purple-500"];
  const icons = [
    Icons.IconSpeakerphone,
    Icons.IconRocket,
    Icons.IconBook,
    Icons.IconFriends,
    Icons.IconWritingSign,
    Icons.IconReportMoney,
  ];

  return (
    <div className="flex justify-center gap-4 flex-wrap mt-8">
      {groups.map((group, index) => (
        <SpaceCard
          key={group.id}
          name={group.name}
          color={colors[index % colors.length]}
          icon={icons[index % icons.length]}
          desctiption={group.mission}
          privateSpace={false}
          linkTo={`/groups/${group.id}`}
        />
      ))}
    </div>
  );
}
