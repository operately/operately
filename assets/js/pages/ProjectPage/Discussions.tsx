import React from "react";

import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Project from "@/graphql/Projects";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { Spacer } from "@/components/Spacer";

import { useNavigateTo } from "@/routes/useNavigateTo";

export default function Discussions({ project }) {
  return (
    <div className="flex flex-col gap-1 relative my-8">
      <div className="font-extrabold text-lg text-white-1 leading-none">Disussions</div>
      <div className="text-white-2 max-w-xl">Ask questions, pitch ideas, gather feedback.</div>

      <Spacer size={0.25} />
      <List project={project} />
      <Spacer size={0.25} />

      <NewDiscussionButton project={project} />
    </div>
  );
}

function List({ project }) {
  const { updates, loading, error } = useDiscussions({ project });

  if (loading) return <div></div>;
  if (error) return <div></div>;

  return (
    <div className="flex flex-col gap-1">
      {updates.map((update) => (
        <ListItem key={update.id} update={update} project={project} />
      ))}
    </div>
  );
}

function ListItem({ update, project }: { update: Updates.Update; project: Project.Project }) {
  const navigateToDiscussion = useNavigateTo(`/projects/${project.id}/discussions/${update.id}`);

  const content = update.content as UpdateContent.ProjectDiscussion;
  const author = update.author;

  return (
    <div
      className="flex flex-row justify-between items-center bg-dark-4 hover:bg-dark-5 p-2 rounded cursor-pointer"
      onClick={navigateToDiscussion}
    >
      <div className="flex gap-2 items-center">
        <Avatar person={author} size="tiny" />
        <div className="font-medium text-white-1 capitalize">{content.title}</div>
      </div>
    </div>
  );
}

function useDiscussions({ project }): { updates: Updates.Update[]; loading: boolean; error: any } {
  const { data, loading, error } = Updates.useListUpdates({
    fetchPolicy: "network-only",
    variables: {
      filter: {
        projectId: project.id,
      },
    },
  });

  if (loading) {
    return { loading, error, updates: [] };
  }

  let updates = data.updates as Updates.Update[];
  updates = Updates.filterByType(updates, "project_discussion");
  updates = Updates.sortByDate(updates);

  return { updates: updates, loading, error };
}

function NewDiscussionButton({ project }) {
  const onClick = useNavigateTo(`/projects/${project.id}/discussions/new`);

  return (
    <div>
      <Button variant="secondary" onClick={onClick} data-test-id="new-discussion-button">
        Start a new topic
      </Button>
    </div>
  );
}
