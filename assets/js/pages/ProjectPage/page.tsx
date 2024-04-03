import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as People from "@/models/people";

import Banner from "./Banner";
import Header from "./Header";
import Overview from "./Overview";
import Timeline from "./Timeline";
import Navigation from "./Navigation";
import { GhostButton, FilledButton } from "@/components/Button";
import { DivLink } from "@/components/Link";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";
import RichContent, { Summary } from "@/components/RichContent";
import { ResourceIcon } from "@/components/KeyResourceIcon";

import { Feed, useItemsQuery } from "@/features/Feed";
import { Link } from "@/components/Link";

import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import { Paths } from "@/routes/paths";
import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";
import Options from "./Options";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={project.name}>
      <Paper.Root>
        <Navigation space={project.space} />

        <Paper.Body>
          <Banner project={project} />
          <Options project={project} />
          <Header project={project} activeTab="overview" />

          <div className="flex flex-col my-10">
            <Overview project={project} />
            <LastCheckIn project={project} />
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
      <FilledButton linkTo={newCheckInPath} testId="check-in-now" size="xs" type="primary">
        Check-In Now
      </FilledButton>
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
    <DivLink className="border-t border-stroke-base pt-8 mt-8" to={path}>
      <div className="uppercase text-xs text-content-accent font-semibold">Last Check-In</div>

      <div className="flex items-start gap-6 mt-4">
        <div className="p-3 border border-stroke-base rounded-lg w-[500px] shadow bg-surface">
          <div className="">
            <div className="flex flex-col gap-1 text-sm">
              <SmallStatusIndicator status={status} />
            </div>
            <div className="flex flex-col gap-1 my-3 text-sm">
              <Summary jsonContent={description} characterCount={200} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Avatar person={author} size={32} />

              <div className="flex flex-col">
                <div className="font-bold leading-snug text-sm">{author.fullName}</div>
                <div className="text-xs leading-snug">
                  <FormattedTime time={time} format="long-date" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm font-semibold">Next Check-In</div>
              <div className="text-sm font-medium">
                Scheduled for <FormattedTime time={project.nextCheckInScheduledAt} format="relative-weekday-or-date" />
              </div>
            </div>
          </div>

          <div className="mt-4">{project.permissions.canCheckIn && checkInNowLink}</div>
        </div>
      </div>
    </DivLink>
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
    <div className="border-t border-stroke-base mt-6 py-6">
      <div className="flex items-center gap-4">
        <div className="text-xs mb-2 uppercase font-bold">Project Description</div>
        {showEditDescription(project) && (
          <Link to={`/projects/${project.id}/edit/description`} testId="edit-project-description-link">
            Edit
          </Link>
        )}
      </div>

      <DescriptionContent project={project} />
    </div>
  );
}

function DescriptionContent({ project }) {
  if (project.description) {
    return <RichContent jsonContent={project.description} />;
  } else {
    return <DescriptionZeroState project={project} />;
  }
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
