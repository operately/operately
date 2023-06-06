import React from "react";

import { useParams } from "react-router-dom";
import { useProject } from "@/graphql/Projects";

import StatusUpdates from "./StatusUpdates";
import Tabs from "./Tabs";
import Header from "./Header";

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
    <div>
      <div className="border-b-2 border-shade-3 border-double -mb-20 pb-20">
        <div className="mt-12 mx-auto max-w-7xl relative px-6">
          <Header project={project} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl relative px-6">
        <div className="flex gap-5">
          <div className="w-2/3 bg-shade-1 pb-8 px-8 rounded-lg border border-shade-3 backdrop-blur">
            <Tabs activeTab={tab} project={project} />
          </div>

          <StatusUpdates project={project} />
        </div>
      </div>
    </div>
  );
}
