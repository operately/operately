import React from "react";

import { GhostButton, PrimaryButton } from "../Button";
import { PageOpen } from "../Page";
import { PageSection } from "../PageSection";
import { SpaceCard } from "../SpaceCards/SpaceCard";
import { SpaceCardGrid } from "../SpaceCards/SpaceCardGrid";
import { HomePageProps, HomePageSpace } from "./types";
import { SpacesZeroState } from "./SpacesZeroState";

export namespace HomePage {
  export type Space = HomePageSpace;
  export type Props = HomePageProps;
}

export function HomePage(props: HomePage.Props) {
  return (
    <PageOpen title="Home" size="medium" testId="company-home" className="px-4 sm:px-0">
      <Greeting firstName={props.firstName} now={props.now} />
      <SpacesSection
        spaces={props.spaces}
        canCreateSpace={props.canCreateSpace}
        canInviteMembers={props.canInviteMembers}
        newSpacePath={props.newSpacePath}
        invitePeoplePath={props.invitePeoplePath}
      />
      <FeedSection activityFeed={props.activityFeed} />
    </PageOpen>
  );
}

function Greeting({ firstName, now }: { firstName: string; now?: Date }) {
  let hour = (now ?? new Date()).getHours();
  let greeting = "";

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  return (
    <p className="font-bold text-3xl mt-20">
      {greeting}, {firstName}!
    </p>
  );
}

function SpacesSection({
  spaces,
  canCreateSpace,
  canInviteMembers,
  newSpacePath,
  invitePeoplePath,
}: {
  spaces: HomePageSpace[];
  canCreateSpace: boolean;
  canInviteMembers: boolean;
  newSpacePath: string;
  invitePeoplePath: string;
}) {
  const isEmpty = spaces.length === 0;

  return (
    <div className="mt-8">
      <PageSection
        title="Your Operately Spaces"
        subtitle="Manage projects, track goals, and organize your team's work."
        actions={
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end sm:flex-nowrap">
            <InvitePeopleButton canInviteMembers={canInviteMembers} invitePeoplePath={invitePeoplePath} />
            <AddSpaceButton canCreateSpace={canCreateSpace} newSpacePath={newSpacePath} />
          </div>
        }
      >
        {isEmpty ? <SpacesZeroState /> : <SpaceGrid spaces={spaces} />}
      </PageSection>
    </div>
  );
}

function FeedSection({ activityFeed }: { activityFeed: HomePageProps["activityFeed"] }) {
  return (
    <div className="mt-8">
      <PageSection title="What's new?" subtitle="Stay up to date with your team's progress.">
        <div className="bg-surface-base shadow rounded-2xl">{activityFeed}</div>
      </PageSection>
    </div>
  );
}

function AddSpaceButton({ canCreateSpace, newSpacePath }: { canCreateSpace: boolean; newSpacePath: string }) {
  if (!canCreateSpace) {
    return null;
  }

  return (
    <PrimaryButton linkTo={newSpacePath} testId="add-space" size="sm">
      Add Space
    </PrimaryButton>
  );
}

function InvitePeopleButton({
  canInviteMembers,
  invitePeoplePath,
}: {
  canInviteMembers: boolean;
  invitePeoplePath: string;
}) {
  if (!canInviteMembers) {
    return null;
  }

  return (
    <GhostButton linkTo={invitePeoplePath} testId="invite-people" size="sm">
      Invite People
    </GhostButton>
  );
}

function SpaceGrid({ spaces }: { spaces: HomePageSpace[] }) {
  const sorted = [...spaces].sort((a, b) => {
    if (a.isCompanySpace) return -1;

    return a.name.localeCompare(b.name);
  });

  return (
    <SpaceCardGrid>
      {sorted.map((space) => (
        <SpaceCard
          key={space.id}
          name={space.name}
          mission={space.mission}
          accessLevels={space.accessLevels}
          members={space.members ?? []}
          linkTo={space.link}
        />
      ))}
    </SpaceCardGrid>
  );
}
