import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";

import MemberList from "./MemberList";

import { useLoadedData, useRefresh } from "./loader";
import { SpacePageNavigation } from "@/components/SpacePageNavigation";
import { Feed, useItemsQuery } from "@/features/Feed";
import { FilledButton } from "@/components/Buttons";

import { useJoinSpace } from "@/models/spaces";

export function Page() {
  const { space } = useLoadedData();

  return (
    <Pages.Page title={space.name!}>
      <Paper.Root size="large">
        <Paper.Body>
          <SpacePageNavigation space={space} activeTab="overview" />
          <SpaceHeader space={space} />
          <SpaceMembers space={space} />
          <JoinButton space={space} />
          <SpaceFooter space={space} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SpaceHeader({ space }: { space: Spaces.Space }) {
  return (
    <div className="mt-12">
      <SpaceIcon space={space} />
      <SpaceName space={space} />
      <SpaceMission space={space} />
    </div>
  );
}

function SpaceIcon({ space }: { space: Spaces.Space }) {
  return (
    <div className="font-medium flex items-center gap-2 justify-center mb-2">
      {React.createElement(Icons[space.icon!], { size: 48, className: space.color, strokeWidth: 1 })}
    </div>
  );
}

function SpaceName({ space }: { space: Spaces.Space }) {
  return <div className="font-bold text-4xl text-center">{space.name}</div>;
}

function SpaceMission({ space }: { space: Spaces.Space }) {
  return (
    <div className="text-center mt-1">
      <div className="">{space.mission}</div>
    </div>
  );
}

function SpaceMembers({ space }: { space: Spaces.Space }) {
  return (
    <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="space-members">
      <MemberList space={space!} />
    </div>
  );
}

function SpaceFooter({ space }: { space: Spaces.Space }) {
  return (
    <Paper.DimmedSection>
      <div className="uppercase text-xs font-semibold mb-2">Activity</div>
      <SpaceActivity space={space} />
    </Paper.DimmedSection>
  );
}

function SpaceActivity({ space }: { space: Spaces.Space }) {
  const { data, loading, error } = useItemsQuery("space", space.id!);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="space-feed" page="space" />;
}

function JoinButton({ space }) {
  const refresh = useRefresh();
  const [join] = useJoinSpace();

  if (space.isMember) return null;

  const handleClick = async () => {
    await join({ spaceId: space.id });
    refresh();
  };

  return (
    <div className="flex justify-center mb-8 mt-6">
      <FilledButton type="primary" size="sm" onClick={handleClick} testId="join-space-button">
        Join this Space
      </FilledButton>
    </div>
  );
}
