import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import Activity from "./Activity";
import Header from "./Header";
import Timeline from "./Timeline";
import Description from "./Description";
import MessageBoardCard from "./MessageBoardCard";
import MilestonesCard from "./MilestonesCard";
import Sidebar from "./Sidebar";
import KeyResources from "./KeyResources";

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
  });

  return {
    project: projectData.data.project,
    me: meData.data.me,
  };
}

export function Page() {
  const [data, refetch] = Paper.useLoadedData() as [LoaderResult, () => void];

  const project = data.project;
  const me = data.me;

  useDocumentTitle(project.name);

  const championOfProject = project.champion?.id === me.id;

  const [sidebarOpen, setSidebarOpen] = React.useState(championOfProject);

  const sidebar = championOfProject ? (
    <Sidebar project={project} isOpen={sidebarOpen} setOpen={setSidebarOpen} />
  ) : null;

  return (
    <Paper.Root size="medium" rightSidebar={sidebar} rightSidebarWidth={sidebarOpen ? "400px" : "0px"}>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects`}>
          <Icons.IconClipboardList size={16} />
          All Projects
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body minHeight="600px">
        <Header project={project} />
        <Timeline project={project} refetch={refetch} editable={championOfProject} />
        <Description me={me} project={project} />
        <KeyResources editable={championOfProject} project={project} refetch={refetch} />
        <Tools project={project} />
        <Activity project={project} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Tools({ project }) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-8">
      <MessageBoardCard project={project} />
      <MilestonesCard project={project} />
    </div>
  );
}
