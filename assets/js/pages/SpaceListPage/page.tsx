import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as People from "@/models/people";

import { SpaceCardLink, SpaceCardGrid } from "@/features/spaces/SpaceCards";

import { useLoadedData } from "./loader";
import { Feed, useItemsQuery } from "@/features/Feed";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { GhostButton } from "@/components/Buttons";
import { Paths } from "@/routes/paths";

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data!.activities!} testId="company-feed" page="company" hideTopBorder paddedGroups />;
}

function AddSpaceButton() {
  return (
    <GhostButton linkTo={Paths.newSpacePath()} testId="add-space" size="sm">
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
