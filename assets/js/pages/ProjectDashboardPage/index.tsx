import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";

import Header from "./Header";
import Timeline from "./Timeline";
import StatusUpdates from "./StatusUpdates";
import ArchivedBanner from "./ArchivedBanner";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Me from "@/graphql/Me";

import { Feed } from "@/components/Feed";

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
      <ArchivedBanner project={project} />

      <div className="p-12 border border-surface-outline bg-surface rounded shadow-xl">
        <div className="p-8 -mx-8 -mt-8">
          <Header project={project} />
        </div>

        <Timeline project={project} refetch={refetch} editable={championOfProject} />

        <div className="my-8 flex items-start gap-6">
          <StatusUpdates project={project} />
        </div>

        <div className="-m-12 mt-12 p-12 border-t border-surface-outline bg-surface-dimmed">
          <div className="uppercase text-xs text-content-accent font-semibold mb-4">Project Activity</div>
          <Feed project={project} />
        </div>
      </div>
    </Paper.Root>
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
