import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";

import { useNavigate, useParams } from "react-router-dom";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";
import * as Updates from "@/graphql/Projects/updates";

import { SurveyForm, Answer } from "@/components/Survey";

import { getPhaseChangeQuestions } from "./questions";
import { getTitle } from "./titles";

export async function loader({ params }) {
  let res = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params["projectID"] },
    fetchPolicy: "network-only",
  });

  return res.data.project;
}

export function Page() {
  const [project] = Paper.useLoadedData() as [Projects.Project];

  const currentPhase = project.phase;
  const { newPhase } = useParams();

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${project.id}`}>
          <Icons.IconClipboardList size={16} />
          {project.name}
        </Paper.NavItem>
      </Paper.Navigation>
      <Paper.Body>
        <Title oldPhase={currentPhase} newPhase={newPhase} />

        <Form project={project} oldPhase={currentPhase} newPhase={newPhase} />
      </Paper.Body>
    </Paper.Root>
  );
}

function Title({ oldPhase, newPhase }) {
  return (
    <div>
      <div className="text-white-1 tracking-wide w-full mb-2 uppercase flex items-center gap-1 text-sm">
        {oldPhase} <Icons.IconArrowRight size={16} /> {newPhase}
      </div>
      <div className="text-4xl font-bold mx-auto">
        <span className="capitalize">{getTitle(oldPhase, newPhase)}</span>
      </div>
    </div>
  );
}

function Form({ project, oldPhase, newPhase }): JSX.Element {
  const navigate = useNavigate();
  const navigateToProject = () => navigate("/projects/" + project.id);
  const questions = getPhaseChangeQuestions(oldPhase, newPhase);

  const [post, { loading }] = Updates.usePostUpdateMutation({
    onCompleted: () => {
      navigate("/projects/" + project.id);
    },
  });

  const handleSubmit = (answers: Answer[]) => {
    post({
      variables: {
        input: {
          updatableType: "project",
          updatableId: project.id,
          messageType: "review",
          phase: newPhase,
          content: JSON.stringify({
            previousPhase: oldPhase,
            newPhase: newPhase,
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
