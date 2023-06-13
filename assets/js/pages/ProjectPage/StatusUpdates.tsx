import React from "react";

import * as Icons from "tabler-icons-react";
import { Link } from "react-router-dom";
import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";

import * as ProjectQueries from "@/graphql/Projects";

interface StatusUpdatesProps {
  project: ProjectQueries.Project;
}

interface StatusUpdateProps {
  linkTo: string;
  person: ProjectQueries.Person;
  title: string;
  message: string | JSX.Element;
  comments: number;
  time: Date;
}

function StatusUpdate(props: StatusUpdateProps) {
  return (
    <Link
      to={props.linkTo}
      className="flex items-center justify-between my-3 hover:bg-shade-1"
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Avatar person={props.person} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between font-bold">
            {props.title}
          </div>
          <div className="line-clamp-1" style={{ maxWidth: "780px" }}>
            {props.message}
          </div>
        </div>
      </div>

      <div className="text-right w-32">
        <FormattedTime time={props.time} format="short-date" />
      </div>
    </Link>
  );
}

export default function StatusUpdates({
  project,
}: StatusUpdatesProps): JSX.Element {
  return (
    <div className="px-16 rounded-b-[30px] pb-8">
      <div className="">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle title="Status Updates" />
          <SeparatorLine />
          <PostUpdateButton link_to={`/projects/${project.id}/new_update`} />
        </div>

        <div className="fadeIn">
          {project.activities.map((activity) => (
            <StatusUpdate
              linkTo={`/projects/${project.id}/updates/${activity.id}`}
              person={activity.author}
              title="Status Update"
              message={<RichContent jsonContent={activity.message} />}
              comments={3}
              time={activity.insertedAt}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PostUpdateButton({ link_to }) {
  return (
    <Link
      to={link_to}
      className="text-pink-400 font-bold uppercase border border-pink-400 rounded-full hover:bg-pink-400/10 px-3 py-1.5 text-sm flex items-center gap-2"
    >
      <Icons.Message2 size={20} />
      Post Update
    </Link>
  );
}

function SeparatorLine() {
  return <div className="border-b border-white-2 flex-1"></div>;
}

function SectionTitle({ title }) {
  return (
    <div className="font-bold py-4 flex items-center gap-2 uppercase">
      {title}
    </div>
  );
}
