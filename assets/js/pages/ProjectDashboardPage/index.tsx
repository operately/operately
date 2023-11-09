import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";

import Header, { ContributorList } from "./Header";
import Timeline from "./Timeline";
import StatusUpdates from "./StatusUpdates";
import ArchivedBanner from "./ArchivedBanner";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Me from "@/graphql/Me";

import { Feed } from "@/components/Feed";
import { NextMilestone } from "./NextMilestone";
import { Label, DimmedLabel } from "./Label";

import { Indicator } from "@/components/ProjectHealthIndicators";
import * as People from "@/models/people";

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

import { GhostButton } from "@/components/Button";
import { DimmedLink, Link } from "@/components/Link";

export function Page() {
  const [data, refetch] = Paper.useLoadedData() as [LoaderResult, () => void, number];

  const project = data.project;
  const me = data.me;

  useDocumentTitle(project.name);

  const championOfProject = project.champion?.id === me.id;

  return (
    <Paper.Root size="large">
      <ArchivedBanner project={project} />

      <div className="p-12 border border-surface-outline bg-surface rounded shadow-xl">
        <div className="mb-8">
          <Header project={project} />
        </div>

        <div className="">
          <div className="uppercase text-xs text-content-accent font-semibold mb-4">Project Overview</div>

          <div className="border-t border-stroke-base pt-4">
            <div className="flex items-start gap-4">
              <div className="w-1/5">
                <div className="font-bold text-sm">Check-Ins</div>
                <div className="text-sm">
                  <Link to={`/projects/${project.id}/status_updates`}>View all</Link>
                </div>
              </div>

              <div className="w-4/5">
                <DimmedLabel>Last Check-In</DimmedLabel>
                <div className="flex items-start gap-2 max-w-xl mt-2">
                  <div className="flex flex-col gap-1">
                    <div className="font-bold flex items-center gap-1">
                      <Avatar person={project.lastCheckIn.author} size="tiny" />
                      {People.shortName(project.lastCheckIn.author)} submitted:
                      <Link to={`/projects/${project.id}/check-ins/${project.lastCheckIn.id}`}>
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
                        <Indicator value={"on_track"} type="status" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <DimmedLabel>Health Issues</DimmedLabel>
                    <div className="flex flex-col gap-1 text-sm">
                      <div>
                        <Indicator value={"key_roles_missing"} type="team" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <DimmedLabel>Next Check-In</DimmedLabel>
                    <div className="text-sm font-medium">
                      Scheduled for this Friday &middot;{" "}
                      <span className="font-extrabold">
                        <Link to={`/projects/${project.id}/status_updates/new`}>Check-In Now</Link>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-4 mt-12">
            <div className="flex items-start gap-4">
              <div className="w-1/5">
                <div className="font-bold text-sm">Timeline</div>

                <div className="text-sm">
                  <Link to={`/projects/${project.id}/milestones`}>Edit</Link>
                </div>
              </div>

              <div className="w-4/5">
                <Timeline project={project} refetch={refetch} editable={championOfProject} />
                <div className="mt-8"></div>
                <NextMilestone project={project} />
              </div>
            </div>
          </div>

          <div className="border-t border-stroke-base pt-4 mt-12">
            <div className="flex items-start gap-4">
              <div className="w-1/4">
                <div className="font-bold text-sm">Resources</div>
              </div>

              <div className="w-3/4"></div>
            </div>
          </div>
        </div>

        <div className="-m-12 mt-12 p-12 border-t border-surface-outline bg-surface-dimmed rounded-b">
          <div className="uppercase text-xs text-content-accent font-semibold mb-4">Project Activity</div>
          <Feed project={project} />
        </div>
      </div>
    </Paper.Root>
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
import { Summary } from "@/components/RichContent";

function Resources({ project }) {
  return (
    <div className="mt-8">
      <div className="uppercase text-xs text-content-accent mb-4 font-bold">Resources</div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded border border-stroke-base flex flex-col h-40">
          <div className="font-bold text-sm border-b border-stroke-base py-1 px-1">Team</div>
          <div className="flex items-center flex-wrap gap-1 p-2">
            <Avatar person={project.champion} />
            <Avatar person={project.reviewer} />
          </div>
        </div>

        <div className="rounded border border-stroke-base flex flex-col h-40">
          <div className="font-bold text-sm border-b border-stroke-base py-1 px-1">Business Case</div>
          <div className="flex items-center flex-wrap gap-1 p-2 text-xs">
            <Summary jsonContent={project.description} characterCount={200} />
          </div>
        </div>

        <div className="rounded border border-stroke-base flex flex-col h-40">
          <div className="font-bold text-sm border-b border-stroke-base py-1 px-1">Milestones</div>
          <div className="flex items-center flex-wrap gap-1 p-2 text-xs">
            <Summary jsonContent={project.description} characterCount={200} />
          </div>
        </div>

        <div className="rounded border border-stroke-base p-4 flex flex-col items-center justify-center h-40">
          <Brands.Github size={32} />

          <div className="text-content-accent font-semibold mt-4 leading-tight text-center">Github Repository</div>

          <div className="text-content-accent text-xs text-green-600 font-medium leading-none mt-1">external link</div>
        </div>

        <div className="rounded border border-stroke-base p-4 flex flex-col items-center justify-center">
          <Brands.GoogleSheets size={32} />

          <div className="text-content-accent font-semibold mt-4 leading-tight text-center">
            Public Google Sheet with KPIs
          </div>

          <div className="text-content-accent text-xs text-green-600 font-medium leading-none mt-1">external link</div>
        </div>

        <div className="rounded border border-stroke-base p-4 flex flex-col items-center justify-center">
          <Icons.IconExternalLink size={32} />

          <div className="text-content-accent font-semibold mt-4 leading-tight text-center">Website</div>

          <div className="text-content-accent text-xs text-green-600 font-medium leading-none mt-1">external link</div>
        </div>
      </div>
    </div>
  );
}

function Tabs() {
  return (
    <div className="-mx-8 border-b border-dark-8 mb-8 px-8 -mt-2">
      <div className="flex gap-1 items-center">
        <div className="border-t border-x border-dark-8 -mb-px bg-dark-2 py-1.5 px-3 rounded-t text-white-1">
          Summary
        </div>

        <div className="border-t border-x border-dark-8 -mb-px py-1.5 px-3 rounded-t text-white-2">Pitch</div>

        <div className="border-t border-x border-dark-8 -mb-px py-1.5 px-3 rounded-t text-white-2 flex items-center gap-3">
          Message Board
          <div className="text-xs bg-shade-2 font-normal rounded-full h-4 w-4">12</div>
        </div>
      </div>
    </div>
  );
}

const Divider = () => <div className="w-px h-10 bg-shade-2 mx-3" />;
