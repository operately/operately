import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Spaces from "@/models/spaces";

import { SpaceCardGrid, SpaceCardLink } from "@/features/spaces/SpaceCards";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Feed, useItemsQuery } from "@/features/Feed";
import { usePaths } from "@/routes/paths";
import { GhostButton, IconCheck } from "turboui";
import { useLoadedData } from "./loader";

export function Page() {
  return (
    <Pages.Page title="Home" testId="company-home">
      <Paper.Root size="medium">
        <Greeting />
        <SetupSection />
        <SpacesSection />
        <FeedSection />
      </Paper.Root>
    </Pages.Page>
  );
}

function SetupSection() {
  const paths = usePaths();
  const { company, spaces, workMap } = useLoadedData();

  // Determine completion status for each setup item
  const hasTeamMembers = (company.memberCount ?? 0) > 1;
  const hasSpaces = spaces.length > 1; // More than just the company space
  const hasProjects = workMap.some((item) => item.type === "project");

  return (
    <div className="mt-8">
      <Paper.Section title="Let's set up your company!">
        <div className="space-y-4">
          <SetupItem
            title="Invite your team"
            description="Get your colleagues onboard and start collaborating together."
            linkTo={paths.peoplePath()}
            linkText="Invite team members"
            testId="setup-invite-team"
            isCompleted={hasTeamMembers}
          />

          <SetupItem
            title="Set up Spaces"
            description="Create organized spaces for different teams, departments, or initiatives."
            linkTo={paths.newSpacePath()}
            linkText="Create a space"
            testId="setup-create-space"
            isCompleted={hasSpaces}
          />

          <SetupItem
            title="Add your first project"
            description="Start tracking progress on your most important work."
            linkTo={paths.workMapPath()}
            linkText="Browse work"
            testId="setup-add-project"
            isCompleted={hasProjects}
          />
        </div>
      </Paper.Section>
    </div>
  );
}

function SetupItem({
  title,
  description,
  linkTo,
  linkText,
  testId,
  isCompleted = false,
}: {
  title: string;
  description: string;
  linkTo: string;
  linkText: string;
  testId: string;
  isCompleted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
        isCompleted
          ? "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20"
          : "border-stroke-base bg-surface-base"
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        {isCompleted && (
          <div className="flex-shrink-0 mt-0.5">
            <IconCheck size={20} className="text-green-600" />
          </div>
        )}
        <div className="flex-1">
          <h3
            className={`font-semibold mb-1 ${
              isCompleted ? "text-green-800 dark:text-green-200" : "text-content-accent"
            }`}
          >
            {title}
          </h3>
          <p className={`text-sm ${isCompleted ? "text-green-600 dark:text-green-300" : "text-content-dimmed"}`}>
            {description}
          </p>
        </div>
      </div>
      {!isCompleted && (
        <GhostButton linkTo={linkTo} testId={testId} size="sm">
          {linkText}
        </GhostButton>
      )}
    </div>
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
    <div className="w-full border-t border-stroke-base animate-pulse flex flex-col sm:flex-row items-start gap-2 py-4">
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
