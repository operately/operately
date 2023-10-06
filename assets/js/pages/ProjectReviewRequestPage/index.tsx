import React from "react";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as ProjectReviewRequests from "@/graphql/ProjectReviewRequests";
import * as People from "@/graphql/People";
import * as Me from "@/graphql/Me";
import * as Paper from "@/components/PaperContainer";

import Button from "@/components/Button";
import RichContent from "@/components/RichContent";
import FormattedTime from "@/components/FormattedTime";
import Avatar from "@/components/Avatar";

import { TextSeparator } from "@/components/TextSeparator";
import { Spacer } from "@/components/Spacer";
import { Separator } from "@/components/Separator";

import { useDocumentTitle } from "@/layouts/header";
import { useNavigateTo } from "@/routes/useNavigateTo";

interface LoaderResult {
  project: Projects.Project;
  request: ProjectReviewRequests.ReviewRequest;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let requestData = await client.query({
    query: ProjectReviewRequests.GET_REQUEST,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    request: requestData.data.projectReviewRequest,
    me: meData.data.me,
  };
}

export function Page() {
  const [{ project, request }] = Paper.useLoadedData() as [LoaderResult];

  useDocumentTitle("Impromptu Review Request");

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <div className="flex flex-col items-center">
          <div className="text-white-1 text-3xl font-extrabold">Impromptu Review Request</div>
          <div className="flex gap-0.5 flex-row items-center mt-1 text-white-1 font-medium">
            <div className="flex items-center gap-2">
              <Avatar person={request.author} size="tiny" /> {request.author.fullName}
            </div>
            <TextSeparator />
            <FormattedTime time={request.insertedAt} format="short-date" />
          </div>
        </div>

        <Spacer size={4} />

        <RichContent jsonContent={request.content} className="text-white-1 text-lg" />

        <Separator spaceTop={4} spaceBottom={4} />

        <div className="flex justify-center">
          {request.status === "pending" && <StartReviewButton project={project} request={request} />}
          {request.status === "completed" && <ReviewLink project={project} request={request} />}
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function StartReviewButton({ project, request }) {
  const navigateToSubmitPage = useNavigateTo(`/projects/${project.id}/reviews/request/${request.id}/submit`);

  return (
    <Button variant="success" data-test-id="write-review-button" size="lg" onClick={navigateToSubmitPage}>
      Start Project Review <Icons.IconArrowRight size={20} />
    </Button>
  );
}

function ReviewLink({ project, request }) {
  const navigateToReviewPage = useNavigateTo(`/projects/${project.id}/reviews/${request.reviewId}`);

  return (
    <Button variant="success" data-test-id="write-review-button" size="lg" onClick={navigateToReviewPage}>
      View Submitted Review <Icons.IconArrowRight size={20} />
    </Button>
  );
}
