import React from "react";

import classnames from "classnames";

import { useDocumentTitle } from "@/layouts/header";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import Activity from "./Activity";
import Header from "./Header";
import Timeline from "./Timeline";
import Description from "./Description";
import MessageBoardCard from "./MessageBoardCard";
import MilestonesCard from "./MilestonesCard";

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
        <Timeline me={me} project={project} refetch={refetch} />
        <Description me={me} project={project} />
        <Tools project={project} />
        <Activity projectId={project.id} />
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

function Sidebar({ project, isOpen, setOpen }) {
  const tasks = [
    {
      title: "Write a project description",
      completed: project.description !== null,
    },
    {
      title: "Set the start and due dates",
      completed: project.staredAt !== null && project.deadline !== null,
    },
    {
      title: "Invite team members and assign roles",
      completed: project.contributors.length > 1,
    },
    {
      title: "Define the project milestones",
      completed: project.milestones.length > 0,
    },
    {
      title: "Write a status update",
      completed: project.updates.length > 0,
    },
  ];

  return (
    <div className="px-4 pt-16 relative">
      <SidebarToggle open={isOpen} setOpen={setOpen} />

      <h1 className="font-bold mb-4 text-xl">Champion's Toolbar</h1>
      <p className="text-sm">
        You are the champion of this project, responsible for leading the execution, setting up the team and their
        roles, and providing regular status updates about the progress.
      </p>

      <div>
        <h1 className="font-bold mb-4 mt-8">Your Tasks</h1>

        <div className="flex flex-col gap-2">
          {tasks.map((task, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={classnames("border rounded-full w-6 h-6 flex items-center justify-center text-xs", {
                  "border-green-400/70 text-green-400": task.completed,
                  "border-white-2 text-white-1": !task.completed,
                })}
              >
                {task.completed ? <Icons.IconCheck size={14} /> : index + 1}
              </div>

              <span>{task.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidebarToggle({ open, setOpen }) {
  if (open) {
    return (
      <button
        className="absolute top-16 -left-10 p-2 rounded bg-white-1/5 hover:bg-white-1/20 transition-colors duration-200"
        onClick={() => setOpen(false)}
      >
        <Icons.IconChevronRight size={16} />
      </button>
    );
  } else {
    return (
      <button
        className="absolute top-16 p-2 rounded bg-white-1/10 hover:bg-white-1/20 transition-colors duration-200 flex items-center gap-2"
        style={{
          left: "-190px",
        }}
        onClick={() => setOpen(true)}
      >
        <Icons.IconArrowBarLeft size={16} />
        <span className="text-sm font-medium">Champion's Toolbar</span>
      </button>
    );
  }
}
