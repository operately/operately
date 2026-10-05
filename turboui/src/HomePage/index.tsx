import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <PageOpen title={t("Home")} size="medium" testId="company-home" className="px-4 sm:px-0">
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
  const { t } = useTranslation();
  let hour = (now ?? new Date()).getHours();
  let greeting = "";

  if (hour < 12) {
    greeting = t("Good morning, {{name}}!", { name: firstName });
  } else if (hour < 18) {
    greeting = t("Good afternoon, {{name}}!", { name: firstName });
  } else {
    greeting = t("Good evening, {{name}}!", { name: firstName });
  }

  return <p className="font-bold text-3xl mt-20">{greeting}</p>;
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
  const { t } = useTranslation();
  const isEmpty = spaces.length === 0;

  return (
    <div className="mt-8">
      <PageSection
        title={t("Your Operately Spaces")}
        subtitle={t("Manage projects, track goals, and organize your team's work.")}
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
  const { t } = useTranslation();
  return (
    <div className="mt-8">
      <PageSection title={t("What's new?")} subtitle={t("Stay up to date with your team's progress.")}>
        <div className="bg-surface-base shadow rounded-2xl">{activityFeed}</div>
      </PageSection>
    </div>
  );
}

function AddSpaceButton({ canCreateSpace, newSpacePath }: { canCreateSpace: boolean; newSpacePath: string }) {
  const { t } = useTranslation();
  if (!canCreateSpace) {
    return null;
  }

  return (
    <PrimaryButton linkTo={newSpacePath} testId="add-space" size="sm">
      {t("Add Space")}
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
  const { t } = useTranslation();
  if (!canInviteMembers) {
    return null;
  }

  return (
    <GhostButton linkTo={invitePeoplePath} testId="invite-people" size="sm">
      {t("Invite People")}
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
