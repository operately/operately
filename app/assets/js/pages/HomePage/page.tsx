import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";

import { SpaceCardGrid, SpaceCardLink } from "@/features/spaces/SpaceCards";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Feed, useItemsQuery } from "@/features/Feed";
import { usePaths } from "@/routes/paths";
import { GhostButton } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  return (
    <Pages.Page title="Home" testId="company-home">
      <Paper.Root size="medium">
        <Greeting />
        <SpacesSection />
        <FeedSection />
      </Paper.Root>
    </Pages.Page>
  );
}

function SpacesSection() {
  const { spaces } = useLoadedData();

  return (
    <div className="mt-8">
      <Paper.Section
        title="Your Operately Spaces"
        subtitle="Manage projects, track goals, and organize your team's work."
        actions={<AddSpaceButton />}
      >
        <SpaceGrid spaces={spaces} />
      </Paper.Section>
    </div>
  );
}

function FeedSection() {
  return (
    <div className="mt-8">
      <Paper.Section title="What's new?" subtitle="Stay up to date with your team's progress.">
        <div className="bg-surface-base shadow rounded-2xl">
          <ActivityFeed />
        </div>
      </Paper.Section>
    </div>
  );
}

function ActivityFeed() {
  const { company } = useLoadedData();
  const { data, loading, error } = useItemsQuery("company", company.id!);

  if (loading) return <ActivityFeedSkeleton />;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="company-feed" page="company" hideTopBorder paddedGroups />;
}

function ActivityFeedSkeleton() {
  return (
    <div className="w-full p-8">
      {/* Simulate 2 activity groups */}
      <ActivityGroupSkeleton />
      <ActivityGroupSkeleton />
    </div>
  );
}

function ActivityGroupSkeleton() {
  return (
    <div className="w-full border-t border-stroke-base flex flex-col sm:flex-row items-start gap-2 py-4">
      {/* Date section skeleton */}
      <div className="w-1/5 shrink-0 mb-2">
        <div className="h-4 bg-surface-dimmed rounded animate-pulse mb-1"></div>
        <div className="h-3 bg-surface-dimmed rounded animate-pulse w-3/4"></div>
      </div>
      
      {/* Activity items skeleton */}
      <div className="flex-1 flex flex-col gap-4">
        <ActivityItemSkeleton />
        <ActivityItemSkeleton />
        <ActivityItemSkeleton />
      </div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex flex-1 gap-3">
      {/* Avatar skeleton */}
      <div className="w-8 h-8 bg-surface-dimmed rounded-full animate-pulse"></div>
      
      {/* Content skeleton */}
      <div className="w-full break-words -mt-0.5">
        <div className="h-4 bg-surface-dimmed rounded animate-pulse mb-1 w-3/4"></div>
        <div className="h-3 bg-surface-dimmed rounded animate-pulse w-1/2"></div>
      </div>
    </div>
  );
}

function AddSpaceButton() {
  const paths = usePaths();

  return (
    <GhostButton linkTo={paths.newSpacePath()} testId="add-space" size="sm">
      Add Space
    </GhostButton>
  );
}

function Greeting() {
  const me = useMe();

  let hour = new Date().getHours();
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
      {greeting}, {People.firstName(me!)}!
    </p>
  );
}

function SpaceGrid({ spaces }: { spaces: Spaces.Space[] }) {
  const sorted = [...spaces].sort((a, b) => {
    if (a.isCompanySpace) return -1;

    return a.name!.localeCompare(b.name!);
  });

  return (
    <SpaceCardGrid>
      {sorted.map((space) => (
        <SpaceCardLink key={space.id} space={space} />
      ))}
    </SpaceCardGrid>
  );
}
