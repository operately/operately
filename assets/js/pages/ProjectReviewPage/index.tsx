import React from "react";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as People from "@/graphql/People";
import * as Me from "@/graphql/Me";
import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";
import * as Paper from "@/components/PaperContainer";

import * as PhaseChange from "@/features/phase_change";
import { AnswersView } from "@/features/phase_change/activity_view";

import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import { Spacer } from "@/components/Spacer";

import { useDocumentTitle } from "@/layouts/header";

interface LoaderResult {
  project: Projects.Project;
  review: Updates.Update;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let reviewData = await client.query({
    query: Updates.GET_STATUS_UPDATE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    review: reviewData.data.update,
    me: meData.data.me,
  };
}

export function Page() {
  const [{ project, review }, _refetch, fetchVersion] = Paper.useLoadedData() as [LoaderResult, () => void, number];

  const content = review.content as UpdateContent.Review;
  const title = `${capitalCase(content.previousPhase)} to ${capitalCase(content.newPhase)} Review`;

  useDocumentTitle(`${title} - ${project.name}`);

  return (
    <Paper.Root key={fetchVersion}>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="flex flex-col items-center -mt-4">
          <div className="text-white-1 text-2xl font-extrabold">{title}</div>
          <div className="flex flex-row gap-2 items-center mt-3 text-white-1 font-medium">
            <Avatar person={review.author} size="tiny" /> {review.author.fullName} &middot;{" "}
            <FormattedTime time={review.insertedAt} format="short-date" />
          </div>
        </div>

        <Spacer size={4} />
        <Content project={project} review={review} />
        <Spacer size={4} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Content({ project, review }: { project: Projects.Project; review: Updates.Update }) {
  const content = review.content as UpdateContent.Review;

  const handler = PhaseChange.handler(
    project,
    content.previousPhase as Projects.ProjectPhase,
    content.newPhase as Projects.ProjectPhase,
  );

  const answers = JSON.parse(review.message);
  const questions = handler.questions();

  return <AnswersView questions={questions} answers={answers} />;
}

function capitalCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
