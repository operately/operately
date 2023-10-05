import * as React from "react";
import * as Icons from "@tabler/icons-react";
import RichContent from "@/components/RichContent";

import { Answer } from "./SurveyForm";

export function SurveyAnswers({ answers }) {
  return (
    <>
      {answers.map((a: Answer) => (
        <AnswersView answer={a} key={a.id} />
      ))}
    </>
  );
}

function AnswersView({ answer }) {
  switch (answer.type) {
    case "yes-no-with-comments":
      return <YesNoWithComments answer={answer} />;
    case "text-area":
      return <TextArea answer={answer} />;
    default:
      throw new Error(`Unknown answer type: ${answer}`);
  }
}

function YesNoWithComments({ answer }) {
  return (
    <div className="border-b border-dark-8 pb-2 mb-2">
      <div className="font-bold text-white-1 flex items-center gap-1">
        {answer.question} <Icons.IconArrowRight size={16} className="text-white-2" />{" "}
        <span className="capitalize">{answer.answer}</span>
      </div>
      <RichContent jsonContent={answer.comments} />
    </div>
  );
}

function TextArea({ answer }) {
  return (
    <div className="border-b border-dark-8 pb-2 mb-2">
      <div className="font-bold text-white-1 flex items-center gap-1">{answer.question}</div>
      <RichContent jsonContent={answer.answer} />
    </div>
  );
}
