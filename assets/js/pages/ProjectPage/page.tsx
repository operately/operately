import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import Banner from "./Banner";
import Header from "./Header";
import Overview from "./Overview";
import Timeline from "./Timeline";
import Navigation from "./Navigation";
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
import { Paths } from "@/routes/paths";
import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";
import Options from "./Options";

export function Page() {
  const { project } = useLoadedData();

  return (
    <Pages.Page title={project.name!}>
      <Paper.Root size="large">
        <Navigation space={project.space!} />

        <Paper.Body>
          <Banner project={project} />
          <Options project={project} />

          <div className="mb-8">
            <Header project={project} />
          </div>

          <div className="">
            <Overview project={project} />

            <div className="mt-4" />

            <div className="border-t border-stroke-base py-6">
              <div className="flex items-start gap-4">
                <div className="w-1/5">
                  <div className="font-bold text-sm">Overview</div>

                  <div className="text-sm">
                    {showEditDescription(project) && (
                      <Link to={Paths.projectEditDescriptionPath(project.id!)} testId="edit-project-description-link">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>

                <div className="w-4/5">
                  <Description project={project} />
                </div>
              </div>
            </div>

            <div className="border-t border-stroke-base py-6">
              <div className="flex items-start gap-4">
                <div className="w-1/5">
                  <div className="font-bold text-sm">Timeline</div>

                  <div className="text-sm">
                    {showEditMilestones(project) && (
                      <Link to={Paths.projectMilestonesPath(project.id!)} testId="manage-timeline">
                        View
                      </Link>
                    )}
                  </div>
                </div>

                <div className="w-4/5">
                  <Timeline project={project} />
                </div>
              </div>
            </div>

            <CheckInSection project={project} />

            <div className="border-t border-stroke-base py-6">
              <div className="flex items-start gap-4">
                <div className="w-1/5">
                  <div className="font-bold text-sm">Resources</div>

                  <div className="text-sm">
                    {showEditResource(project) && (
                      <Link to={Paths.projectEditResourcesPath(project.id!)} testId="edit-resources-link">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>

                <div className="w-4/5">
                  <Resources project={project} />
                </div>
              </div>
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

  return <Feed items={data!.activities!} testId="project-feed" page="project" />;
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
  const path = Paths.projectCheckInPath(project.lastCheckIn.id);

  return (
    <div>
      <DimmedLabel>Last Check-In</DimmedLabel>
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
  const editPath = Paths.projectEditResourcesPath(project.id!);

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
      {project.keyResources!.map((resource: any, index: number) => (
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
  if (project.description) {
    return <RichContent jsonContent={project.description} />;
  } else {
    return <DescriptionZeroState project={project} />;
  }
}

function DescriptionZeroState({ project }) {
  const writePath = Paths.projectEditDescriptionPath(project.id!);

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
  if (!project.permissions!.canEditResources) return false;

  const resources = project.keyResources || [];

  return resources.length > 0;
}

function showEditDescription(project: Projects.Project) {
  if (!project.permissions!.canEditDescription) return false;

  return project.description !== null;
}

function showEditMilestones(project: Projects.Project) {
  if (!project.permissions!.canEditMilestone) return false;

  const milestones = project.milestones || [];

  return milestones.length > 0;
}

function CheckInSection({ project }) {
  return (
    <div className="border-t border-stroke-base py-6">
      <div className="flex items-start gap-4">
        <div className="w-1/5">
          <div className="font-bold text-sm">Check-Ins</div>
          {project.lastCheckIn && (
            <div className="text-sm">
              <Link to={Paths.projectCheckInsPath(project.id!)}>View all</Link>
            </div>
          )}
        </div>

        <div className="w-4/5">
          <LastCheckIn project={project} />
        </div>
      </div>
    </div>
  );
}
