import React from "react";
import * as Icons from "@tabler/icons-react";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as ProjectReviewRequests from "@/graphql/ProjectReviewRequests";
import * as People from "@/graphql/People";
import * as Me from "@/graphql/Me";
import * as Paper from "@/components/PaperContainer";
import * as Updates from "@/graphql/Projects/updates";

import { Spacer } from "@/components/Spacer";

import { useDocumentTitle } from "@/layouts/header";

import { SurveyForm, Answer, yesNoQuestion } from "@/components/Survey";
import { useNavigate } from "react-router-dom";

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
        <div className="text-white-1 text-3xl font-extrabold">Project Review</div>

        <Spacer size={4} />

        <Form project={project} reviewRequest={request} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form({ project, reviewRequest }): JSX.Element {
  const navigate = useNavigate();
  const navigateToProject = () => navigate(`/projects/${project.id}`);

  const questions = [
    yesNoQuestion("schedule", "Schedule", `Is the project on schedule?`),
    yesNoQuestion("costs", "Costs", `Is the project within budget?`),
    yesNoQuestion("team", "Team", "Is the team staffed with suitable roles?"),
    yesNoQuestion("risks", "Risks", "Are there any outstanding project risks?"),
  ];

  const [post, { loading }] = Updates.usePostUpdateMutation({
    onCompleted: (res) => {
      const id = res.createUpdate.id;
      navigate(`/projects/${project.id}/reviews/${id}`);
    },
  });

  const handleSubmit = (answers: Answer[]) => {
    post({
      variables: {
        input: {
          updatableType: "project",
          updatableId: project.id,
          messageType: "review",
          phase: project.phase,
          reviewRequestId: reviewRequest.id,
          content: JSON.stringify({
            previousPhase: project.phase,
            newPhase: project.phase,
            survey: {
              answers: answers,
            },
          }),
        },
      },
    });
  };

  return (
    <div className="mt-8">
      <SurveyForm questions={questions} onSubmit={handleSubmit} onCancel={navigateToProject} loading={loading} />
    </div>
  );
}
