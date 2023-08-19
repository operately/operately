import React from "react";
import { Question } from "./questions";
import { Answers, Answer, YesNoAnswer, TextAreaAnswer } from "./answers";
import * as ProjectIcons from "@/components/ProjectIcons";

export function PhaseChangeDiagram({ from, to }: { from: string; to: string }) {
  const fromIcon = <ProjectIcons.IconForPhase phase={from} />;
  const toIcon = <ProjectIcons.IconForPhase phase={to} />;

  return (
    <div className="flex items-center gap-2">
      {fromIcon} <span className="capitalize">{from}</span> -&gt; {toIcon} <span className="capitalize">{to}</span>
    </div>
  );
}

export function AnswersView({ questions, answers }: { questions: Question[]; answers: Answers }) {
  return (
    <>
      {questions.map((q) => (
        <Anwer key={q.name} question={q} answer={answers[q.name]} />
      ))}
    </>
  );
}

function Anwer({ question, answer }: { question: Question; answer: Answer }) {
  switch (question.type) {
    case "yes_no_with_comments":
      return <YesNoAnswer question={question.question} answer={answer} />;
    case "text_area":
      return <TextAreaAnswer question={question.question || question.title} answer={answer} />;
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
          {answer.answer.split("\n").map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
