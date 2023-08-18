import React from "react";

import { Handler } from "../handler";
import { Question, yesNoQuestion, textAreaQuestion } from "../questions";
import { Answers, Answer, YesNoAnswer, TextAreaAnswer } from "../answers";

import * as ProjectIcons from "@/components/ProjectIcons";
import * as Icons from "@tabler/icons-react";

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

    const fromIcon = <ProjectIcons.IconForPhase phase={this.from} />;
    const toIcon = <ProjectIcons.IconForPhase phase={this.to} />;

    return () => (
      <>
        <div className="flex flex-col items-center gap-2 mb-8 border-b border-shade-1 pb-8">
          <Icons.IconConfetti className="text-pink-400 mb-2" size={40} stroke={1} />

          <p className="font-bold mb-2 text-xl">The project has moved to the {this.to} phase</p>
          <div className="flex items-center gap-2">
            {fromIcon} <span className="capitalize">{this.from}</span> -&gt; {toIcon}{" "}
            <span className="capitalize">{this.to}</span>
          </div>
        </div>

        <p className="font-medium mb-4">Review of the {this.from} phase:</p>
        {questions.map((q) => (
          <Anwer key={q.name} question={q} answer={answers[q.name]} />
        ))}
      </>
    );
  }
}

function Anwer({ question, answer }: { question: Question; answer: Answer }) {
  switch (question.type) {
    case "yes_no_with_comments":
      return <YesNoAnswer question={question.question} answer={answer} />;
    case "text_area":
      return <TextAreaAnswer question={question.question} answer={answer} />;
  }
}

function YesNoAnswer({ question, answer }: { question: string; answer: YesNoAnswer }) {
  return (
    <div className="flex flex-col mb-2 border border-shade-2 px-3 py-2 rounded bg-shade-1/[3%]">
      <div className="flex items-center justify-between">
        <span className="font-bold capitalize">{question}</span>
        <span className="font-bold capitalize">{answer.answer}</span>
      </div>

      {answer.comments && <div className="border-t border-shade-2 pt-2 mt-1 -mx-3 px-3">{answer.comments}</div>}
    </div>
  );
}

function TextAreaAnswer({ question, answer }: { question: string; answer: TextAreaAnswer }) {
  return (
    <div className="flex flex-col mb-2 border border-shade-2 px-3 py-2 rounded bg-shade-1/[3%]">
      <div className="flex items-center justify-between">
        <span className="font-bold capitalize">{question}</span>
      </div>

      {answer.answer && (
        <div className="border-t border-shade-2 pt-2 mt-1 -mx-3 px-3">
          <pre>{answer.answer}</pre>
        </div>
      )}
    </div>
  );
}
