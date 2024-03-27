import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import Banner from "./Banner";
import Header from "./Header";
import Overview from "./Overview";
import Timeline from "./Timeline";
import Navigation from "./Navigation";
import ContributorAvatar from "@/components/ContributorAvatar";
import { GhostButton } from "@/components/Button";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import RichContent, { Summary } from "@/components/RichContent";
import { ResourceIcon } from "@/components/KeyResourceIcon";

import { Feed, useItemsQuery } from "@/features/Feed";
import { DimmedLabel } from "./Label";

import * as People from "@/models/people";
import { Link } from "@/components/Link";

import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import { Paths } from "@/routes/paths";
import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";
import { match } from "ts-pattern";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={project.name}>
      <Paper.Root size="large">
        <Navigation space={project.space} />

        <Paper.Body>
          <Banner project={project} />

          <div className="-mx-16 px-10">
            <Header project={project} />
            <Tabs />
          </div>

          <div className="-mx-16 px-10 bg-surface-dimmed py-6">
            <div className="bg-surface px-8 rounded-lg border border-stroke-base divide-y divide-stroke-base">
              <Overview project={project} />
              <Description project={project} />
              <LastCheckInSection project={project} />
              <ResourcesSection project={project} />
            </div>
          </div>

          <Paper.DimmedSection>
            <div className="uppercase text-xs text-content-accent font-semibold mb-4">Project Activity</div>
            <ProjectFeed project={project} />
          </Paper.DimmedSection>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function ProjectFeed({ project }) {
  const { data, loading, error } = useItemsQuery("project", project.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;

  return <Feed items={data.activities} testId="project-feed" page="project" />;
}

function LastCheckIn({ project }) {
  const newCheckInPath = Paths.projectCheckInNewPath(project.id);

  const checkInNowLink = (
    <div className="flex">
      <GhostButton linkTo={newCheckInPath} testId="check-in-now" size="xs" type="secondary">
        Check-In Now
      </GhostButton>
    </div>
  );

  if (!project.lastCheckIn) {
    return (
      <div className="text-sm">
        Asking the champion to check-in every Friday.
        {project.permissions.canCheckIn && <div className="mt-2">{checkInNowLink}</div>}
      </div>
    );
  }

  const author = project.lastCheckIn.author;
  const time = project.lastCheckIn.insertedAt;
  const description = project.lastCheckIn.description;
  const status = project.lastCheckIn.status;
  const path = Paths.projectCheckInPath(project.id, project.lastCheckIn.id);

  return (
    <div>
      <div className="flex items-start gap-2 max-w-xl mt-2">
        <div className="flex flex-col gap-1">
          <div className="font-bold flex items-center gap-1">
            <Avatar person={author} size="tiny" />
            {People.shortName(author)} submitted:
            <Link to={path} testId="last-check-in-link">
              Check-in <FormattedTime time={time} format="long-date" />
            </Link>
          </div>
          <Summary jsonContent={description} characterCount={200} />
        </div>
      </div>

      <div className="flex items-start gap-12 mt-6">
        <div>
          <DimmedLabel>Status</DimmedLabel>
          <div className="flex flex-col gap-1 text-sm">
            <SmallStatusIndicator status={status} />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <DimmedLabel>Next Check-In</DimmedLabel>
            <div className="text-sm font-medium">
              Scheduled for <FormattedTime time={project.nextCheckInScheduledAt} format="relative-weekday-or-date" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">{project.permissions.canCheckIn && checkInNowLink}</div>
    </div>
  );
}

function Resources({ project }) {
  if (project.keyResources.length === 0) {
    return <ResourcesZeroState project={project} />;
  } else {
    return <ResourcesList project={project} />;
  }
}

function ResourcesZeroState({ project }) {
  const editPath = createPath("projects", project.id, "edit", "resources");

  const editLink = (
    <GhostButton linkTo={editPath} testId="add-resources-link" size="xs" type="secondary">
      Add Resources
    </GhostButton>
  );

  return (
    <div className="text-sm">
      No resources have been added yet.
      {project.permissions.canEditResources && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}

function ResourcesList({ project }: { project: Projects.Project }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {project.keyResources!.map((resource, index) => (
        <Resource
          key={index}
          icon={<ResourceIcon resourceType={resource!.resourceType} size={32} />}
          title={resource!.title}
          href={resource!.link}
        />
      ))}
    </div>
  );
}

function Resource({ icon, title, href }) {
  return (
    <a
      href={href}
      target="_blank"
      className="rounded border border-stroke-base hover:border-surface-outline cursor-pointer flex flex-col items-center justify-center text-center"
    >
      <div className="pt-6 pb-3">{icon}</div>
      <div className="pb-6 px-5">
        <div className="text-content-accent text-sm font-semibold leading-snug">{title}</div>
      </div>
    </a>
  );
}

function Description({ project }) {
  return (
    <div className="py-6">
      <div className="uppercase text-xs font-bold mb-2">Description</div>
      {project.description ? (
        <RichContent jsonContent={project.description} />
      ) : (
        <DescriptionZeroState project={project} />
      )}
    </div>
  );
}

function DescriptionZeroState({ project }) {
  const writePath = createPath("projects", project.id, "edit", "description");

  const editLink = (
    <GhostButton linkTo={writePath} testId="write-project-description-link" size="xs" type="secondary">
      Write project description
    </GhostButton>
  );

  return (
    <div className="text-sm">
      Project description is not yet set.
      {project.permissions.canEditDescription && <div className="mt-2 flex">{editLink}</div>}
    </div>
  );
}

function showEditResource(project: Projects.Project) {
  if (!project.permissions.canEditResources) return false;

  const resources = project.keyResources || [];

  return resources.length > 0;
}

function showEditDescription(project: Projects.Project) {
  if (!project.permissions.canEditDescription) return false;

  return project.description !== null;
}

function showEditMilestones(project: Projects.Project) {
  if (!project.permissions.canEditMilestone) return false;

  const milestones = project.milestones || [];

  return milestones.length > 0;
}

function LastCheckInSection({ project }) {
  return (
    <div className="py-8 border-b border-dashed border-stroke-base">
      <div className="uppercase text-xs font-bold mb-4">Last Check-In</div>
      <LastCheckIn project={project} />
    </div>
  );
}

function Tabs() {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 text-sm">
        <div className="border-b-2 border-orange-500 font-medium py-1 px-1">Overview</div>
        <div className="border-b-2 border-transparent hover:border-orange-500 font-medium py-1 px-1">Milestones</div>
        <div className="border-b-2 border-transparent hover:border-orange-500 font-medium py-1 px-1">Team</div>
      </div>
      <div className="-mx-10 border-t border-stroke-base" />
    </div>
  );
}

function Team({ project }: { project: Projects.Project }) {
  const sortedContributors = Projects.sortContributorsByRole(project.contributors as Projects.ProjectContributor[]);

  return (
    <div className="py-6">
      <div className="uppercase text-xs font-bold mb-4">Contributors</div>
      <div className="flex items-center gap-16 ">
        <div>
          <div className="flex items-center justify-center gap-8 cursor-pointer">
            {sortedContributors.map(
              (c) =>
                c && (
                  <div className="flex items-center gap-2" key={c.id}>
                    <Avatar person={c.person} size={32} />
                    <div className="flex flex-col">
                      <div className="text-sm font-bold">{People.shortName(c.person)}</div>
                      <div className="text-sm truncate max-w-32">{role(c)}</div>
                    </div>
                  </div>
                ),
            )}

            {project.permissions.canEditContributors && <div className="ml-2"></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function role(contributor: Projects.ProjectContributor) {
  return match(contributor.role)
    .with("champion", () => "Champion")
    .with("reviewer", () => "Reviewer")
    .with("contributor", () => contributor.responsibility)
    .otherwise(() => {
      throw new Error("Invalid role");
    });
}

function ResourcesSection({ project }) {
  return (
    <div className="py-6">
      <div className="uppercase text-xs font-bold mb-4">Resources</div>

      <Resources project={project} />
    </div>
  );
}
