import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";

import Header from "./Header";
import Timeline from "./Timeline";
import ArchivedBanner from "./ArchivedBanner";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Me from "@/graphql/Me";

import { Feed } from "@/components/Feed";
import { NextMilestone } from "./NextMilestone";
import { DimmedLabel } from "./Label";

import { Indicator } from "@/components/ProjectHealthIndicators";
import * as People from "@/models/people";
import { Link } from "@/components/Link";

interface LoaderResult {
  project: Projects.Project;
  me: any;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    me: meData.data.me,
  };
}

export function Page() {
  const [data, refetch] = Paper.useLoadedData() as [LoaderResult, () => void, number];

  const project = data.project;
  const me = data.me;

  useDocumentTitle(project.name);

  const championOfProject = project.champion?.id === me.id;

  return (
    <Paper.Root size="large">
      <div className="p-12 border border-surface-outline bg-surface rounded shadow-xl">
        <ArchivedBanner project={project} />
        <div className="mb-8">
          <Header project={project} />
        </div>

        <div className="">
          <Timeline project={project} refetch={refetch} editable={championOfProject} />

          <div className="mt-4" />

          <div className="border-t border-stroke-base py-6">
            <div className="flex items-start gap-4">
              <div className="w-1/5">
                <div className="font-bold text-sm">Overview</div>

                <div className="text-sm">
                  <Link to={`/projects/${project.id}/edit/description`} testId="edit-project-description">
                    Edit
                  </Link>
                </div>
              </div>

              <div className="w-4/5">
                <RichContent jsonContent={project.description} />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base py-6">
            <div className="flex items-start gap-4">
              <div className="w-1/5">
                <div className="font-bold text-sm">Check-Ins</div>
                {project.lastCheckIn && (
                  <div className="text-sm">
                    <Link to={`/projects/${project.id}/status_updates`}>View all</Link>
                  </div>
                )}
              </div>

              <div className="w-4/5">
                <LastCheckIn project={project} />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base py-6">
            <div className="flex items-start gap-4">
              <div className="w-1/5">
                <div className="font-bold text-sm">Milestones</div>

                <div className="text-sm">
                  <Link to={`/projects/${project.id}/milestones`}>View all</Link>
                </div>
              </div>

              <div className="w-4/5">
                <NextMilestone project={project} />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base py-6">
            <div className="flex items-start gap-4">
              <div className="w-1/5">
                <div className="font-bold text-sm">Resources</div>

                <div className="text-sm">
                  <Link to={`/projects/${project.id}/milestones`}>Manage</Link>
                </div>
              </div>

              <div className="w-4/5">
                <Resources project={project} />
              </div>
            </div>
          </div>
        </div>

        <div className="-m-12 mt-6 p-12 border-t border-surface-outline bg-surface-dimmed rounded-b">
          <div className="uppercase text-xs text-content-accent font-semibold mb-4">Project Activity</div>
          <Feed project={project} />
        </div>
      </div>
    </Paper.Root>
  );
}

function LastCheckIn({ project }) {
  const checkInNowLink = (
    <Link to={`/projects/${project.id}/status_updates/new`} testId="check-in-now">
      Check-In Now
    </Link>
  );

  if (project.lastCheckIn === null) {
    return (
      <div className="text-sm">
        Asking the champion to check-in every Friday.
        <div className="mt-2 font-bold">{checkInNowLink}</div>
      </div>
    );
  }

  return (
    <div>
      <DimmedLabel>Last Check-In</DimmedLabel>
      <div className="flex items-start gap-2 max-w-xl mt-2">
        <div className="flex flex-col gap-1">
          <div className="font-bold flex items-center gap-1">
            <Avatar person={project.lastCheckIn.author} size="tiny" />
            {People.shortName(project.lastCheckIn.author)} submitted:
            <Link to={`/projects/${project.id}/status_updates/${project.lastCheckIn.id}`} testId="last-check-in-link">
              Check-in November 3rd
            </Link>
          </div>
          <Summary jsonContent={project.lastCheckIn.content.message} characterCount={200} />
        </div>
      </div>

      <div className="flex items-start gap-12 mt-6">
        <div>
          <DimmedLabel>Status</DimmedLabel>
          <div className="flex flex-col gap-1 text-sm">
            <div>
              <Indicator value={project.lastCheckIn.content.health.status} type="status" />
            </div>
          </div>
        </div>

        <div>
          <DimmedLabel>Health Issues</DimmedLabel>
          <HealthIssues checkIn={project.lastCheckIn} />
        </div>

        <div>
          <DimmedLabel>Next Check-In</DimmedLabel>
          <div className="text-sm font-medium">
            Scheduled for this Friday &middot; <span className="font-extrabold">{checkInNowLink}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthIssues({ checkIn }) {
  const issues = Object.keys(checkIn.content.health).filter((type) => {
    if (type === "status") {
      return false;
    }

    if (type === "schedule") {
      return checkIn.content.health[type] !== "on_schedule";
    }

    if (type === "budget") {
      return checkIn.content.health[type] !== "within_budget";
    }

    if (type === "team") {
      return checkIn.content.health[type] !== "staffed";
    }

    if (type === "risks") {
      return checkIn.content.health[type] !== "no_known_risks";
    }

    return false;
  });

  if (issues.length === 0) {
    return <div className="text-sm text-content-dimmed">No issues</div>;
  }

  return (
    <div className="flex flex-col text-sm">
      {issues.map((issue) => (
        <div>
          <Indicator key={issue} value={checkIn.content.health[issue]} type={issue} />
        </div>
      ))}
    </div>
  );
}

// <div className="my-8 flex items-start gap-6">
//   <StatusUpdates project={project} />
// </div>

// <NextMilestone project={project} />

// <Resources project={project} />

import * as Brands from "./Brands";
import * as Icons from "@tabler/icons-react";
import Avatar from "@/components/Avatar";
import RichContent, { Summary } from "@/components/RichContent";

function Resources({ project }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {project.keyResources.map((resource) => (
        <Resource icon={<ResourceIcon resource={resource} />} title={resource.title} href={resource.link} />
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
        <div className="text-content-accent text-xs text-green-600 font-medium leading-none mt-1">external link</div>
      </div>
    </a>
  );
}

const GithubLinkRegex = new RegExp("^https://github.com/.*/.*$");
const GoogleSheetLinkRegex = new RegExp("^https://docs.google.com/spreadsheets/d/.*$");

function ResourceIcon({ resource }) {
  if (resource.link.match(GithubLinkRegex)) {
    return <Brands.Github size={34} />;
  }

  if (resource.link.match(GoogleSheetLinkRegex)) {
    return <Brands.GoogleSheets size={34} />;
  }

  return <Icons.IconLink size={34} />;
}

function Documentation({ project }) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="flex items-center flex-col gap-1">
        <div
          className="bg-surface-dimmed rounded shadow border border-stroke-base cursor-default"
          style={{
            width: "100px",
            height: "142px",
            fontSize: "4px",
            padding: "12px",
            overflow: "hidden",
          }}
        >
          <div className="text-content-accent font-semibold leading-thight mb-1">Business Case</div>
          <Summary jsonContent={project.description} characterCount={400} />
        </div>

        <div className="mt-1 text-sm">
          <Link to={`/projects/${project.id}/milestones`}>Business Case</Link>
        </div>
      </div>

      <div className="flex items-center flex-col gap-1">
        <div
          className="bg-surface-dimmed rounded shadow border border-stroke-base cursor-default"
          style={{
            width: "100px",
            height: "142px",
            fontSize: "4px",
            padding: "12px",
            overflow: "hidden",
          }}
        >
          <div className="text-content-accent font-semibold leading-thight mb-1">Retrospective</div>
          <Summary jsonContent={project.description} characterCount={400} />
        </div>

        <div className="mt-1 text-sm">
          <Link to={`/projects/${project.id}/milestones`}>Restrospective</Link>
        </div>
      </div>
    </div>
  );
}
