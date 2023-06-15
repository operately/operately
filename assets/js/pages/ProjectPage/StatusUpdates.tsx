import React from "react";

import * as Icons from "@tabler/icons-react";
import { Link } from "react-router-dom";
import RichContent from "@/components/RichContent";
import Avatar from "@/components/Avatar";
import FormattedTime from "@/components/FormattedTime";
import Button from "@/components/Button";

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

function AckStatus({ update }) {
  if (update.acknowledged) {
    return (
      <div className="flex items-center text-sm text-green-400 gap-1">
        <Icons.IconCircleCheckFilled size={16} />
      </div>
    );
  } else {
    return (
      <div className="flex items-center text-sm text-yellow-400 gap-1 font-medium">
        <Icons.IconClockFilled size={16} />
        Waiting for Acknowledgement
      </div>
    );
  }
}

function StatusUpdate(props: StatusUpdateProps) {
  return (
    <Link
      to={props.linkTo}
      className="flex items-center justify-between my-2 hover:bg-shade-1 p-1 rounded -ml-2"
    >
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <Avatar person={props.person} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-bold">{props.title}</div>
            <AckStatus update={props.update} />
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

function StatusUpdateZeroState() {
  return (
    <div className="flex items-center justify-center text-white-2 gap-2 py-24">
      <Icons.IconMessage2 size={24} />
      Share the progress of the project with your team.
    </div>
  );
}

function StatusUpdateList({ project, updates }) {
  return (
    <>
      {updates.map((update) => (
        <StatusUpdate
          key={update.id}
          linkTo={`/projects/${project.id}/updates/${update.id}`}
          person={update.author}
          title={"Status Update"}
          message={<RichContent jsonContent={update.message} />}
          comments={update.comments.length}
          time={update.insertedAt}
          update={update}
        />
      ))}
    </>
  );
}

export default function StatusUpdates(props: StatusUpdatesProps): JSX.Element {
  const project = props.project;
  const postUpdateLink = `/projects/${project.id}/new_update`;
  const updates = project.activities;

  const isEmpty = updates.length === 0;

  return (
    <div className="px-16 rounded-b-[30px] py-8 bg-dark-3 min-h-[350px] ">
      <div className="">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle title="Project Activity" />
          <SeparatorLine />
          <PostUpdateButton linkTo={postUpdateLink} />
        </div>

        <div className="fadeIn">
          {isEmpty ? (
            <StatusUpdateZeroState />
          ) : (
            <StatusUpdateList project={project} updates={updates} />
          )}
        </div>
      </div>
    </div>
  );
}

function PostUpdateButton({ linkTo }) {
  return (
    <Button linkTo={linkTo}>
      <Icons.IconMessage2 size={20} />
      Post Update
    </Button>
  );
}

function SeparatorLine() {
  return <div className="border-b border-white-2 flex-1"></div>;
}

function SectionTitle({ title }) {
  return (
    <div className="font-bold py-4 flex items-center gap-2 uppercase tracking-wide">
      {title}
    </div>
  );
}
