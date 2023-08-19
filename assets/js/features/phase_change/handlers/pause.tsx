import React from "react";

import { Handler } from "../handler";
import { Question, textAreaQuestion } from "../questions";
import { Answers } from "../answers";

import * as Icons from "@tabler/icons-react";
import { AnswersView, PhaseChangeDiagram } from "../activity_view";

export class Pause extends Handler {
  updateType(): string {
    return "review";
  }

  questions(): Question[] {
    return [
      textAreaQuestion("why-are-you-pausing", "Why are you pausing this project?"),
      textAreaQuestion("when-will-you-resume", "When will you resume this project?"),
    ];
  }

  formHeader(): React.FC {
    return () => (
      <div>
        <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: PAUSING PROJECT</div>
        <div className="text-4xl font-bold mx-auto">Pausing work on the project</div>
      </div>
    );
  }

  activityMessage(answers: Answers): React.FC {
    const questions = this.questions();

    return () => (
      <>
        <div className="flex flex-col items-center gap-2 mb-8 border-b border-shade-1 pb-8">
          <Icons.IconHandStop className="text-gray-400 mb-2" size={40} stroke={1} />

          <p className="font-bold mb-2 text-xl">Project is being paused</p>
          <PhaseChangeDiagram from={this.from} to={this.to} />
        </div>

        <AnswersView questions={questions} answers={answers} />
      </>
    );
  }
}
