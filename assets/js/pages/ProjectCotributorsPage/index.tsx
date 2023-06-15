import React from "react";

import { useParams } from "react-router-dom";
import { useProject } from "@/graphql/Projects";
import { Link } from "react-router-dom";

import * as Icons from "@tabler/icons-react";

export function ProjectContributorsPage() {
  const params = useParams();
  const projectId = params["project_id"];

  if (!projectId) return <p className="mt-16">Unable to find project</p>;

  const { loading, error, data } = useProject(projectId);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find project</p>;

  const project = data.project;

  return (
    <div className="mt-24">
      <div className="flex justify-between items-center mb-4 mx-auto max-w-4xl">
        <BackToProject linkTo={`/projects/${projectId}`} />
      </div>

      <div className="mx-auto max-w-4xl relative bg-dark-2 rounded-[20px]">
        Contributors
      </div>
    </div>
  );
}

function BackToProject({ linkTo }) {
  return (
    <Link to={linkTo}>
      <div className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:bg-pink-400/10 px-3 py-1.5 text-sm flex items-center gap-2 mt-4">
        <Icons.IconArrowLeft size={20} />
        Back To Project
      </div>
    </Link>
  );
}
