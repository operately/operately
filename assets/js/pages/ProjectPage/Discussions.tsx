import React from "react";

import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Project from "@/graphql/Projects";

import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import FormattedTime from "@/components/FormattedTime";

import { useNavigateTo } from "@/routes/useNavigateTo";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";

export default function Discussions({ project }) {
  return (
    <div className="flex flex-col gap-1 relative my-8">
      <div className="font-extrabold text-lg text-content-accent leading-none">Disussions</div>
      <div className="text-content-dimmed max-w-xl">Ask questions, pitch ideas, gather feedback.</div>

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
      className="bg-dark-4 hover:bg-dark-5 p-2 rounded cursor-pointer"
      onClick={navigateToDiscussion}
      title={content.title}
    >
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <Avatar person={author} size="tiny" />
          <div className="font-medium text-content-accent">{content.title}</div>
        </div>

        <div className="flex items-center text-sm">
          <CommentCount update={update} />
          <TextSeparator size={1.5} />
          <FormattedTime time={update.insertedAt} format="short-date" />
        </div>
      </div>
    </div>
  );
}

function CommentCount({ update }: { update: Updates.Update }) {
  if (update.comments.length === 0) {
    return <div>No comments</div>;
  }

  if (update.comments.length === 1) {
    return <div>1 comment</div>;
  }

  return <div>{update.comments.length} comments</div>;
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
