import React from "react";

import { useDocumentTitle } from "@/layouts/header";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import Activity from "./Activity";
import Header from "./Header";
import Timeline from "./Timeline";
import Description from "./Description";
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
        <Timeline2 />
        <Timeline project={project} refetch={refetch} editable={championOfProject} />
        <Description me={me} project={project} />
        <KeyResources editable={championOfProject} project={project} refetch={refetch} />
        <Activity project={project} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Timeline2() {
  return (
    <div className="mb-10">
      <div className="flex items-center w-full rounded-lg relative">
        <div className="overflow-hidden rounded h-8 flex items-center w-full">
          <div className="w-1/3 flex items-center gap-0.5">
            <div className="w-1/12 bg-yellow-400 h-8"></div>
            <div className="w-11/12 bg-blue-400 h-8 text-dark-3 font-semibold flex items-center pl-2"></div>
          </div>

          <div className="w-2/3 bg-shade-1 h-8 text-sm flex items-center justify-end pr-2 text-white-2">
            {" "}
            No Due Date
          </div>
        </div>

        <div className="bg-blue-100 absolute -top-0.5 -bottom-0.5 left-1/3 w-1"></div>

        <div className="absolute rounded-full top-2 w-2 h-2" style={{ left: "1%" }}>
          <Icons.IconFlag2Filled size={14} className="text-white-2" />
        </div>

        <div className="absolute rounded-full top-2 w-2 h-2" style={{ left: "20%" }}>
          <Icons.IconFlag2Filled size={14} className="text-white-2" />
        </div>

        <div className="absolute rounded-full top-2 w-2 h-2" style={{ left: "26%" }}>
          <Icons.IconFlag2Filled size={14} className="text-white-2" />
        </div>

        <div className="absolute rounded-full top-2 w-2 h-2" style={{ left: "80%" }}>
          <Icons.IconFlag2Filled size={14} className="text-white-2" />
        </div>
      </div>

      <div className="mb-4 flex items-center mt-4">
        <div className="">Jun 17 -&gt; Oct 10</div>

        <div className="mx-3">&middot;</div>

        <div className="flex items-center gap-2">
          Next:
          <Icons.IconFlag2Filled size={16} className="text-yellow-400" />
          Define Marketing KPIs
        </div>
      </div>
    </div>
  );
}
