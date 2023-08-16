import React from "react";
import * as Forms from "@/components/Form";
import { useNavigate } from "react-router-dom";

const questions = [
  {
    name: "schedule",
    title: "Schedule",
    question: "Was the planning phase completed on schedule?",
    type: "yes_no_with_comments",
  },
  {
    name: "costs",
    title: "Costs",
    question: "Was the planning phase completed within budget?",
    type: "yes_no_with_comments",
  },
  {
    name: "team",
    title: "Team",
    question: "Was the team staffed with suitable roles?",
    type: "yes_no_with_comments",
  },
  {
    name: "risks",
    title: "Risks",
    question: "Are there any outstanding project risks?",
    type: "yes_no_with_comments",
  },
  {
    name: "deliverables",
    title: "Deliverables",
    question: "Summarize the deliverables of the planning phase",
    type: "text_area",
  },
];

export default function Review({ project }) {
  const navigate = useNavigate();

  const [answers, setAnswers] = React.useState({
    schedule: {
      answer: "",
      comments: "",
    },
    costs: {
      answer: "",
      comments: "",
    },
    team: {
      answer: "",
      comments: "",
    },
    risks: {
      answer: "",
      comments: "",
    },
    deliverables: {
      answer: "",
    },
  });

  const setAnswer = (name: string, field: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [name]: {
        ...prev[name],
        [field]: answer,
      },
    }));
  };

  const loading = false;
  const valid = true;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(answers);
  };

  const handleCancel = () => {
    navigate("/projects/" + project.id);
  };

  return (
    <div className="flex flex-col gap-8 my-8">
      <Forms.Form onSubmit={handleSubmit} isValid={true} loading={loading} onCancel={handleCancel}>
        {questions.map((question) => {
          switch (question.type) {
            case "yes_no_with_comments":
              return (
                <YesNoQuestionWithComments
                  key={question.name}
                  name={question.name}
                  title={question.title}
                  question={question.question}
                  answer={answers[question.name].answer}
                  setAnswer={(answer: string) => setAnswer(question.name, "answer", answer)}
                  comments={answers[question.name].comments}
                  setComments={(comments: string) => setAnswer(question.name, "comments", comments)}
                />
              );
            case "text_area":
              return (
                <TextAreaQuestion
                  name={question.name}
                  key={question.name}
                  title={question.title}
                  question={question.question}
                  answer={answers[question.name].answer}
                  setAnswer={(answer: string) => setAnswer(question.name, "answer", answer)}
                />
              );
            default:
              throw new Error(`Unknown question type: ${question.type}`);
          }
        })}

        <Forms.SubmitArea>
          <Forms.SubmitButton type="submit" disabled={!valid} loading={loading}>
            Submit
          </Forms.SubmitButton>
          <Forms.CancelButton>Cancel</Forms.CancelButton>
        </Forms.SubmitArea>
      </Forms.Form>
    </div>
  );
}

function YesNoQuestionWithComments({ name, title, question, answer, setAnswer, comments, setComments }) {
  return (
    <div data-test-id={"section-" + name}>
      <div className="font-bold">{title}</div>

      <div className="flex justify-between items-center mb-2">
        <p className="font-medium">{question}</p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <input
              type="radio"
              name={name}
              value="yes"
              id={name + "-yes"}
              data-test-id={name + "-yes"}
              checked={answer === "yes"}
              onChange={() => setAnswer("yes")}
            />
            <label htmlFor={name + "-yes"}>Yes</label>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name={name}
              value="no"
              id={name + "-no"}
              data-test-id={name + "-no"}
              checked={answer === "no"}
              onChange={() => setAnswer("no")}
            />
            <label htmlFor={name + "-no"}>No</label>
          </div>
        </div>
      </div>

      <textarea
        data-test-id={name + "-comments"}
        className="w-full h-20 bg-dark-5 rounded outline-none border-none resize-none"
        placeholder="Leave a comment..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />
    </div>
  );
}

function TextAreaQuestion({ name, title, question, answer, setAnswer }) {
  return (
    <div data-test-id={"section-" + name}>
      <div className="font-bold">{title}</div>

      <div className="flex justify-between items-center mb-2">
        <p className="font-medium">{question}</p>
      </div>

      <textarea
        data-test-id={name + "-answer"}
        className="w-full h-20 bg-dark-5 rounded outline-none border-none resize-none"
        placeholder="Write here..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />
    </div>
  );
}
