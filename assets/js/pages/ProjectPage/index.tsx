import React from "react";

import { useParams } from "react-router-dom";
import { useProject } from "@/graphql/Projects";

import StatusUpdates from "./StatusUpdates";
import Tabs from "./Tabs";
import Header from "./Header";
import * as Icons from "tabler-icons-react";

export function ProjectPage() {
  const params = useParams();

  const id = params["id"];
  const tab = params["*"] || "";

  if (!id) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = useProject(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  let project = data.project;

  return (
    <div className="mt-16">
      <Header project={project} />

      <div className="mx-auto max-w-5xl relative bg-dark-3 rounded-[30px]">
        <Top project={project} />
        <StatusUpdates project={project} />
      </div>
    </div>
  );
}

// <Tabs activeTab={tab} project={project} />

function Top({ project }) {
  return (
    <div className="px-16 rounded-t-[30px] py-16 flex justify-between gap-8 h-96">
      <Description project={project} />
      <Milestones project={project} />

      <div className="w-1/3 bg-shade-1 rounded-lg"></div>
    </div>
  );
}

function Description({ project }) {
  return (
    <div className="w-1/3 bg-shade-1 rounded-lg">
      <h1 className="uppercase font-bold text-center my-3">Description</h1>
    </div>
  );
}

function Milestones({ project }) {
  return (
    <div className="w-1/3 bg-shade-1 rounded-lg px-2 py-4 cursor-pointer border-4 border-transparent hover:border-shade-3 transition">
      <h1 className="uppercase font-bold text-center mb-4">Milestones</h1>

      <div className="flex flex-col gap-1">
        {project.milestones.map((m) => (
          <div className="flex items-center justify-between bg-shade-1 px-2 py-1.5 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <div className=" text-blue-400">
                {m.status === "done" ? <Icons.CircleCheck /> : <Icons.Circle />}
              </div>
              <div>{m.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
