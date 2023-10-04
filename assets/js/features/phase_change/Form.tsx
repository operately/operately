import * as React from "react";
import * as Updates from "@/graphql/Projects/updates";

import { useNavigate } from "react-router-dom";

import { SurveyForm, Answer } from "@/components/Survey";

export function Form({ project, handler, questions }) {
  const navigate = useNavigate();
  const navigateToProject = () => navigate("/projects/" + project.id);

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
          content: JSON.stringify(answers),
          messageType: "review",
          phase: handler.to,
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
