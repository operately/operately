import React from "react";

import { useParams } from "react-router-dom";
import FormattedTime from "@/components/FormattedTime";

import * as ProjectQueries from "@/graphql/Projects";
import RichContent from "@/components/RichContent";
import Avatar, { AvatarSize } from "@/components/Avatar";

function Header({ update }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-8 py-4 border-b border-white-2">
        <Avatar person={update.author} size={AvatarSize.Large} />

        <div>
          <div className="font-bold">{update.author.fullName}</div>
          <div className="text-white-1">
            Champion of the {update.project.name} project
          </div>
        </div>
      </div>

      <div className="uppercase text-white-1 tracking-wide w-full mb-2">
        <FormattedTime time={update.insertedAt} format="short-date-with-time" />
      </div>
      <div className="text-4xl font-bold mx-auto">Status Update</div>
    </div>
  );
}

export function ProjectStatusUpdatePage() {
  const params = useParams();

  const projectId = params.projectId;
  const id = params.id || "";

  const { data, loading, error } = ProjectQueries.useProjectStatusUpdate(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find update</p>;

  const update = data?.update;

  return (
    <div className="mt-24">
      <div className="mx-auto max-w-5xl relative bg-dark-2 rounded-[20px] px-32 py-16">
        <Header update={update} />

        <div className="my-8 text-lg">
          <RichContent jsonContent={update.message} />
        </div>
      </div>
    </div>
  );
}
