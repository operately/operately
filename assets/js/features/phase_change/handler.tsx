import React from "react";

import { ProjectPhase } from "@/graphql/Projects";
import * as Projects from "@/graphql/Projects";

import { Answers, buildEmptyAnswers } from "./answers";
import { Question } from "./questions";
import { Form } from "./Form";

export abstract class Handler {
  protected from: ProjectPhase;
  protected to: ProjectPhase;
  protected project: Projects.Project;

  constructor(project: Projects.Project, from: ProjectPhase, to: ProjectPhase) {
    this.project = project;
    this.from = from;
    this.to = to;
  }

  emptyAnswers(): Answers {
    return buildEmptyAnswers(this.questions());
  }

  form(): React.FC {
    return () => <Form project={this.project} handler={this} questions={this.questions()} />;
  }

  abstract updateType(): string;
  abstract questions(): Question[];
  abstract formHeader(): React.FC;
  abstract activityMessage(answers: Answers): React.FC;
}
