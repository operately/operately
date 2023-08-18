import React from "react";

import { Handler } from "../handler";
import { Question, textAreaQuestion } from "../questions";
import { Answers } from "../answers";

import * as ProjectIcons from "@/components/ProjectIcons";
import * as Icons from "@tabler/icons-react";
import { AnswersView } from "../activity_view";

export class Retrospective extends Handler {
  updateType(): string {
    return "retrospective";
  }

  questions(): Question[] {
    return [
      textAreaQuestion("what-went-well", "What went well?"),
      textAreaQuestion("what-could-be-better", "What could've gone better?"),
      textAreaQuestion("what-we-learned", "What we learned?"),
    ];
  }

  formHeader(): React.FC {
    const action = this.to === "completed" ? "completing" : "canceling";

    return () => {
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: {action} THE PROJECT</div>
          <div className="text-4xl font-bold mx-auto">Project Retrospective</div>
        </div>
      );
    };
  }

  activityMessage(answers: Answers): React.FC {
    const questions = this.questions();

    const fromIcon = <ProjectIcons.IconForPhase phase={this.from} />;
    const toIcon = <ProjectIcons.IconForPhase phase={this.to} />;
    const HeroIcon = this.HeroIcon();
    const Title = this.Title();

    return () => (
      <>
        <div className="flex flex-col items-center gap-2 mb-8 border-b border-shade-1 pb-8">
          <HeroIcon />
          <Title />

          <div className="flex items-center gap-2">
            {fromIcon} <span className="capitalize">{this.from}</span> -&gt; {toIcon}{" "}
            <span className="capitalize">{this.to}</span>
          </div>
        </div>

        <p className="font-medium mb-4">Project Retrospective</p>
        <AnswersView questions={questions} answers={answers} />
      </>
    );
  }

  private Title(): React.FC {
    return () => {
      if (this.to === "completed") {
        return <div className="text-xl font-bold">Project Completed</div>;
      } else {
        return <div className="text-xl font-bold">Project Canceled</div>;
      }
    };
  }

  private HeroIcon(): React.FC {
    return () => {
      if (this.to === "completed") {
        return <Icons.IconConfetti className="text-pink-400 mb-2" size={40} stroke={1} />;
      } else {
        return <Icons.IconCircleX className="text-red-400 mb-2" size={40} stroke={1} />;
      }
    };
  }
}
