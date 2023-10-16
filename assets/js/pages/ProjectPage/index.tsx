import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Paper from "@/components/PaperContainer";

import Activity from "./Activity";
import Header from "./Header";
import Timeline from "./Timeline";
import Description from "./Description";
import Reviews from "./Reviews";
import StatusUpdates from "./StatusUpdates";
import KeyResources from "./KeyResources";
import Discussions from "./Discussions";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Me from "@/graphql/Me";

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
  const [data, refetch, fetchVersion] = Paper.useLoadedData() as [LoaderResult, () => void, number];

  const project = data.project;
  const me = data.me;

  useDocumentTitle(project.name);

  const championOfProject = project.champion?.id === me.id;

  return (
    <Paper.Root size="medium">
      <div className="p-8 border border-dark-3 bg-dark-2 rounded shadow-xl">
        <div className="bg-dark-2 p-8 -mx-8 -mt-8">
          <Header project={project} />
        </div>

        <Divider />
        <Description me={me} project={project} refetch={refetch} />
        <Divider />
        <KeyResources editable={championOfProject} project={project} refetch={refetch} />
        <Divider />
        <Timeline project={project} refetch={refetch} editable={championOfProject} />
        <Divider />
        <StatusUpdates me={me} project={project} />
        <Divider />
        <Reviews me={me} project={project} />
        <Divider />
        <Discussions project={project} />
        <Divider />
        <Activity project={project} key={fetchVersion} />
      </div>
    </Paper.Root>
  );
}

function Divider() {
  return <div className="-mx-8 border-t border-dark-5" />;
}
