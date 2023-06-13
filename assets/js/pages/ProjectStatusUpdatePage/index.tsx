import React from "react";

import { useParams, Link } from "react-router-dom";
import FormattedTime from "@/components/FormattedTime";

import * as Icons from "tabler-icons-react";
import * as ProjectQueries from "@/graphql/Projects";
import { useMe } from "@/graphql/Me";
import RichContent from "@/components/RichContent";
import Avatar, { AvatarSize } from "@/components/Avatar";

export function ProjectStatusUpdatePage() {
  const params = useParams();

  const projectId = params.project_id;
  const id = params.id || "";

  const { data, loading, error } = ProjectQueries.useProjectStatusUpdate(id);

  if (loading) return <p className="mt-16">Loading...</p>;
  if (error) return <p className="mt-16">Error : {error.message}</p>;
  if (!data) return <p className="mt-16">Can't find update</p>;

  const update = data?.update;

  return (
    <div className="mt-24">
      <div className="flex justify-between items-center mb-4 mx-auto max-w-5xl ">
        <BackToProject linkTo={`/projects/${projectId}`} />

        <div className="flex gap-4">
          <Prev />
          <Next />
        </div>
      </div>

      <div className="mx-auto max-w-5xl relative bg-dark-2 rounded-[20px] px-32 py-16">
        <AckBanner update={update} reviwer={update.project.reviewer} />
        <Header update={update} />

        <div className="my-8 text-lg">
          <RichContent jsonContent={update.message} />
        </div>

        <Reactions />
        <Comments />
      </div>
    </div>
  );
}

function AckBanner({ reviwer, update }) {
  if (update.acknowledged) {
    return null;
  } else {
    return <div>Waiting for acknowledgement from {reviwer}</div>;
  }
}

function BackToProject({ linkTo }) {
  return (
    <Link
      to={linkTo}
      className="text-emerald-400 font-bold uppercase border border-emerald-400 rounded-full hover:border-white-2 text-white-1 hover:text-white-1 px-3 py-1.5 text-sm flex items-center gap-2 mt-4"
    >
      <Icons.ArrowLeft size={20} />
      Back To Project
    </Link>
  );
}

function Prev() {
  return (
    <button className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:border-white-2 text-white-1 hover:text-white-1 px-3 py-1.5 text-sm flex items-center gap-2 mt-4">
      <Icons.ArrowLeft size={20} />
      Previous Update
    </button>
  );
}

function Next() {
  return (
    <button className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:border-white-2 text-white-1 hover:text-white-1 px-3 py-1.5 text-sm flex items-center gap-2 mt-4">
      Next Update
      <Icons.ArrowRight size={20} />
    </button>
  );
}

function Header({ update }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-8 py-4 border-b border-white-2">
        <div className="border-2 border-yellow-400 p-1 rounded-full">
          <Avatar person={update.author} size={AvatarSize.Normal} />
        </div>

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

function Reactions() {
  return (
    <div className="flex">
      <div className="rounded-[30px] bg-shade-1 p-3 hover:text-pink-400 cursor-pointer">
        <Icons.ThumbUp size={24} />
      </div>
    </div>
  );
}

function Comments() {
  const { data } = useMe();

  return (
    <div className="border-t border-white-2 mt-8 pt-8">
      <div className="flex gap-4 items-center">
        <Avatar person={data.me} size={AvatarSize.Normal} />

        <div className="text-white-2">Start the discussion here&hellip;</div>
      </div>
    </div>
  );
}
