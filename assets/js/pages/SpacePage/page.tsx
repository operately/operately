import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import { Feed, useItemsQuery } from "@/features/Feed";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";

import { useJoinSpace } from "@/models/spaces";
import { PrivacyIndicator } from "@/features/spaces/PrivacyIndicator";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";
import { ToolsSection } from "@/features/SpaceTools";

import { useLoadedData, useRefresh } from "./loader";
import { Paths } from "@/routes/paths";
import AvatarList from "@/components/AvatarList";
import { match } from "ts-pattern";

export function Page() {
  const { space, tools } = useLoadedData();

  assertPresent(space.notifications, "notifications must be present in space");
  useClearNotificationsOnLoad(space.notifications);

  return (
    <Pages.Page title={space.name!} testId="space-page">
      <Paper.Root size="large">
        <Paper.Body>
          <SpaceEdit />
          <SpaceHeader space={space} />
          <SpaceMembers space={space} />
          <JoinButton space={space} />
          <ToolsSection space={space} tools={tools} />
          <SpaceFooter space={space} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SpaceEdit() {
  const { space } = useLoadedData();

  if (space.permissions?.canEdit !== true) return null;

  return (
    <div className="absolute right-4 top-4">
      <SecondaryButton size="xs" linkTo={Paths.spaceEditPath(space.id!)} testId="edit-space">
        Edit
      </SecondaryButton>
    </div>
  );
}

function SpaceHeader({ space }: { space: Spaces.Space }) {
  return (
    <div className="mt-2">
      <SpaceName space={space} />
      <SpaceMission space={space} />
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
  const size = Pages.useWindowSizeBreakpoints();

  const peopleToShow = match(size)
    .with("xs", () => 5)
    .with("sm", () => 10)
    .with("md", () => 15)
    .otherwise(() => 20);

  return (
    <div className="font-medium flex items-center gap-2 w-full justify-center mt-2" data-test-id="space-members">
      <AvatarList people={space.members!} stacked size="small" maxElements={peopleToShow} />
      <ManageAccessButton space={space} />
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

function ManageAccessButton({ space }: { space: Spaces.Space }) {
  const path = Paths.spaceAccessManagementPath(space.id!);

  assertPresent(space.permissions, "permissions must be present in space");
  if (!space.permissions.canAddMembers) return null;

  return (
    <SecondaryButton linkTo={path} size="xs" testId="access-management">
      Manage access
    </SecondaryButton>
  );
}
