import React from "react";

import FormattedTime from "@/components/FormattedTime";

import * as Icons from "@tabler/icons-react";
import * as People from "@/graphql/People";
import * as Paper from "@/components/PaperContainer";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import RichContent from "@/components/RichContent";

import * as Me from "@/graphql/Me";
import * as Projects from "@/graphql/Projects";
import * as Updates from "@/graphql/Projects/updates";
import client from "@/graphql/client";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { useAddReaction } from "./useAddReaction";
import * as Feed from "@/features/feed";
import { CommentSection } from "./CommentSection";

interface LoaderData {
  project: Projects.Project;
  update: Updates.Update;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderData> {
  let projectDate = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let updateData = await client.query({
    query: Updates.GET_STATUS_UPDATE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    project: projectDate.data.project,
    update: updateData.data.update,
    me: meData.data.me,
  };
}

export function Page() {
  const [{ project, update, me }, refetch] = Paper.useLoadedData() as [LoaderData, () => void];

  const addReactionForm = useAddReaction(update.id, "update", refetch);

  return (
    <Paper.Root>
      <Navigation project={project} />

      <Paper.Body>
        <AckCTA project={project} update={update} refetch={refetch} me={me} />

        <div className="flex flex-col items-center">
          <div className="text-white-1 text-2xl font-extrabold">Status Update</div>
          <div className="flex gap-0.5 flex-row items-center mt-1 text-white-1 font-medium">
            <div className="flex items-center gap-2">
              <Avatar person={update.author} size="tiny" /> {update.author.fullName}
            </div>
            <TextSeparator />
            <FormattedTime time={update.insertedAt} format="short-date" />
            <TextSeparator />
            <Acknowledgement update={update} />
          </div>
        </div>

        <Spacer size={4} />

        <div className="fadeIn">
          <div className="my-4 mb-8 text-lg">
            <RichContent jsonContent={update.message} />
          </div>

          <Feed.Reactions reactions={update.reactions} size={20} form={addReactionForm} />
        </div>

        <Spacer size={4} />

        <div className="text-white-1 font-extrabold border-b border-shade-2 pb-2">Comments</div>
        <CommentSection update={update} refetch={refetch} me={me} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Navigation({ project }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/projects/${project.id}`}>
        <Icons.IconClipboardList size={16} />
        {project.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

function AckCTA({
  project,
  update,
  refetch,
  me,
}: {
  project: Projects.Project;
  update: Updates.Update;
  refetch: () => void;
  me: People.Person;
}) {
  const [ack, { loading }] = Updates.useAckUpdate();

  if (update.acknowledged) return null;
  if (!project.reviewer) return null;
  if (project.reviewer.id !== me.id) return null;

  const handleAck = async () => {
    await ack({
      variables: {
        id: update.id,
      },
    });

    refetch();
  };

  return (
    <div className="px-4 py-3 bg-shade-1 flex items-center justify-between font-bold -mt-4 mb-8 rounded">
      Waiting for your acknowledgement
      <Button variant="success" size="tiny" data-test-id="acknowledge-update" loading={loading} onClick={handleAck}>
        <Icons.IconCheck size={16} className="-mr-1" stroke={3} />
        Acknowledge
      </Button>
    </div>
  );
}

function Acknowledgement({ update }: { update: Updates.Update }) {
  if (update.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <Icons.IconCircleCheck size={16} className="text-green-400" />
        Acknowledged by {update.acknowledgingPerson.fullName}
      </span>
    );
  } else {
    return <span className="flex items-center gap-1">Not acknowledged</span>;
  }
}
