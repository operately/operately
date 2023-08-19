import React from "react";

import { Handler } from "../handler";
import { Question, yesNoQuestion, textAreaQuestion } from "../questions";
import { Answers } from "../answers";

import * as Icons from "@tabler/icons-react";
import { AnswersView, PhaseChangeDiagram } from "../activity_view";

export class Review extends Handler {
  updateType(): string {
    return "review";
  }

  questions(): Question[] {
    return [
      yesNoQuestion("schedule", "Schedule", `Was the ${this.from} phase completed on schedule?`),
      yesNoQuestion("costs", "Costs", `Was the ${this.from} phase completed within budget?`),
      yesNoQuestion("team", "Team", "Was the team staffed with suitable roles?"),
      yesNoQuestion("risks", "Risks", "Are there any outstanding project risks?"),
      textAreaQuestion("deliverables", "Deliverables", `Summarize the deliverables of the ${this.from} phase`),
    ];
  }

  formHeader(): React.FC {
    return () => {
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: PHASE CHANGE</div>
          <div className="text-4xl font-bold mx-auto">
            <span className="capitalize">{this.from}</span> -&gt; <span className="capitalize">{this.to}</span>
          </div>
        </div>
      );
    };
  }

  activityMessage(answers: Answers): React.FC {
    const questions = this.questions();

    return () => (
      <>
        <div className="flex flex-col items-center gap-2 mb-8 border-b border-shade-1 pb-8">
          <Icons.IconConfetti className="text-pink-400 mb-2" size={40} stroke={1} />

          <p className="font-bold mb-2 text-xl">The project has moved to the {this.to} phase</p>
          <PhaseChangeDiagram from={this.from} to={this.to} />
        </div>

        <p className="font-medium mb-4">Review of the {this.from} phase:</p>
        <AnswersView questions={questions} answers={answers} />
      </>
    );
  }
}
