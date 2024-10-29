import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";

import MemberList from "../SpacePage/MemberList";

import { useLoadedData, useRefresh } from "./loader";
import { SpacePageNavigation } from "@/components/SpacePageNavigation";
import { Feed, useItemsQuery } from "@/features/Feed";
import { PrimaryButton } from "@/components/Buttons";

import { useJoinSpace } from "@/models/spaces";
import { PrivacyIndicator } from "@/features/spaces/PrivacyIndicator";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { ToolsSection } from "@/features/SpaceTools";

export function Page() {
  const { space, discussions, goals, projects } = useLoadedData();

  assertPresent(space.notifications, "notifications must be present in space");
  useClearNotificationsOnLoad(space.notifications);

  return (
    <Pages.Page title={space.name!} testId="space-page">
      <Paper.Root size="large">
        <Paper.Body>
          <SpacePageNavigation space={space} activeTab="overview" />
          <SpaceHeader space={space} />
          <SpaceMembers space={space} />
          <JoinButton space={space} />
          <ToolsSection space={space} discussions={discussions} goals={goals} projects={projects} />
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
  return (
    <div className="flex items-center gap-2 justify-center">
      <PrivacyIndicator space={space} size={30} />
      <div className="font-bold text-4xl text-center">{space.name}</div>
    </div>
  );
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
      <PrimaryButton size="sm" onClick={handleClick} testId="join-space-button">
        Join this Space
      </PrimaryButton>
    </div>
  );
}
