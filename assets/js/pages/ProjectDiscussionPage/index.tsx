import React from "react";

import FormattedTime from "@/components/FormattedTime";

import * as Icons from "@tabler/icons-react";
import * as People from "@/graphql/People";
import * as Paper from "@/components/PaperContainer";

import Avatar from "@/components/Avatar";
import RichContent from "@/components/RichContent";

import * as Me from "@/graphql/Me";
import * as Projects from "@/graphql/Projects";
import * as Updates from "@/graphql/Projects/updates";
import client from "@/graphql/client";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { useAddReaction } from "./useAddReaction";
import * as Feed from "@/features/feed";
import * as UpdateContent from "@/graphql/Projects/update_content";
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
  const content = update.content as UpdateContent.ProjectDiscussion;

  return (
    <Paper.Root>
      <Navigation project={project} />

      <Paper.Body>
        <div className="flex flex-col items-center">
          <div className="text-white-1 text-3xl font-extrabold">{content.title}</div>
          <div className="flex gap-0.5 flex-row items-center mt-1 text-white-1 font-medium">
            <div className="flex items-center gap-2">
              <Avatar person={update.author} size="tiny" /> {update.author.fullName}
            </div>
            <TextSeparator />
            <FormattedTime time={update.insertedAt} format="short-date" />
          </div>
        </div>

        <Spacer size={4} />
        <RichContent jsonContent={content.body} className="text-lg" />

        <Spacer size={2} />
        <Feed.Reactions reactions={update.reactions} size={20} form={addReactionForm} />

        <Spacer size={4} />
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
