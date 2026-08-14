import React from "react";

import type { AccessLevels } from "../ApiTypes";
import type { AvatarPerson } from "../Avatar";
import { GhostButton, PrimaryButton } from "../Button";
import type { FormattedTimePreferences } from "../FormattedTime";
import { PageNew } from "../Page";
import { ProductReleaseAnnouncement, type ProductRelease } from "../ProductReleaseAnnouncement";
import { SpaceCard, SpaceCardGrid } from "../SpaceCards";
import { SpacesZeroState } from "./SpacesZeroState";

export namespace HomePage {
  export interface Space {
    id: string;
    name: string;
    mission?: string | null;
    accessLevels?: AccessLevels | null;
    members?: AvatarPerson[];
    linkTo: string;
    isCompanySpace?: boolean;
  }

  export interface Props {
    firstName: string;
    now?: Date;
    spaces: Space[];
    canCreateSpace: boolean;
    canInviteMembers: boolean;
    newSpaceLink: string;
    invitePeopleLink: string;
    feed: React.ReactNode;
    productRelease: ProductRelease | null;
    onDismissProductRelease: () => void;
    formattedTimePreferences: FormattedTimePreferences;
  }
}

export function HomePage(props: HomePage.Props) {
  return (
    <PageNew title="Home" size="medium" testId="company-home" className="px-4 sm:px-0">
      <Greeting firstName={props.firstName} now={props.now} />
      <SpacesSection
        spaces={props.spaces}
        canCreateSpace={props.canCreateSpace}
        canInviteMembers={props.canInviteMembers}
        newSpaceLink={props.newSpaceLink}
        invitePeopleLink={props.invitePeopleLink}
      />
      <FeedSection feed={props.feed} />

      {props.productRelease ? (
        <ProductReleaseAnnouncement
          release={props.productRelease}
          onDismiss={props.onDismissProductRelease}
          formattedTimePreferences={props.formattedTimePreferences}
        />
      ) : null}
    </PageNew>
  );
}

function Greeting({ firstName, now }: { firstName: string; now?: Date }) {
  const hour = (now ?? new Date()).getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
  newSpaceLink,
  invitePeopleLink,
}: {
  spaces: HomePage.Space[];
  canCreateSpace: boolean;
  canInviteMembers: boolean;
  newSpaceLink: string;
  invitePeopleLink: string;
}) {
  return (
    <div className="mt-8">
      <Section
        title="Your Operately Spaces"
        subtitle="Manage projects, track goals, and organize your team's work."
        actions={
          <div className="flex flex-wrap gap-2 justify-start sm:justify-end sm:flex-nowrap">
            {canInviteMembers ? (
              <GhostButton linkTo={invitePeopleLink} testId="invite-people" size="sm">
                Invite People
              </GhostButton>
            ) : null}
            {canCreateSpace ? (
              <PrimaryButton linkTo={newSpaceLink} testId="add-space" size="sm">
                Add Space
              </PrimaryButton>
            ) : null}
          </div>
        }
      >
        {spaces.length === 0 ? <SpacesZeroState /> : <SpaceGrid spaces={spaces} />}
      </Section>
    </div>
  );
}

function FeedSection({ feed }: { feed: React.ReactNode }) {
  return (
    <div className="mt-8">
      <Section title="What's new?" subtitle="Stay up to date with your team's progress.">
        <div className="bg-surface-base shadow rounded-2xl">{feed}</div>
      </Section>
    </div>
  );
}

function SpaceGrid({ spaces }: { spaces: HomePage.Space[] }) {
  const sorted = [...spaces].sort((a, b) => {
    if (a.isCompanySpace) return -1;
    if (b.isCompanySpace) return 1;

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
          linkTo={space.linkTo}
        />
      ))}
    </SpaceCardGrid>
  );
}

function Section({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        className={
          subtitle
            ? "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
            : "mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
        }
      >
        <div>
          <h2 className="font-bold">{title}</h2>
          {subtitle ? <p className="text-sm max-w-xl">{subtitle}</p> : null}
        </div>
        {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
