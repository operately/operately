import * as React from "react";
import { Answers } from "./answers";
import * as Forms from "@/components/Form";
import { useNavigate } from "react-router-dom";
import * as Updates from "@/graphql/Projects/updates";
import * as Projects from "@/graphql/Projects";
import { Handler } from "./handler";

export function Form({ project, handler }: { project: Projects.Project; handler: Handler }) {
  const [post, { loading }] = Updates.usePostUpdateMutation();
  const navigate = useNavigate();

  const emptyAnswers = handler.emptyAnswers();

  const [answers, setAnswers] = React.useState<Answers>(emptyAnswers);

  const setAnswer = (name: string, field: string, answer: string) => {
    setAnswers((answers: Answers): Answers => {
      return {
        ...answers,
        [name]: {
          ...answers[name],
          [field]: answer,
        },
      } as Answers;
    });
  };

  const valid = Object.values(answers).every((answer) => answer.answer !== "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
                  answer={answers[question.name]!.answer}
                  setAnswer={(answer: string) => setAnswer(question.name, "answer", answer)}
                  comments={(answers[question.name]! as YesNoAnswer).comments}
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
                  answer={answers[question.name]!.answer}
                  setAnswer={(answer: string) => setAnswer(question.name, "answer", answer)}
                />
              );
            default:
              throw new Error(`Unknown question type: ${question.type}`);
          }
        })}

        <Forms.SubmitArea>
          <Forms.SubmitButton type="submit" disabled={!valid} loading={loading} data-test-id="submit">
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

      <Forms.Textarea
        data-test-id={name + "-comments"}
        className="w-full bg-dark-5 rounded outline-none border-none resize-none"
        style={{ minHeight: "4rem" }}
        placeholder="Leave a comment..."
        value={comments}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
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

      <Forms.Textarea
        data-test-id={name + "-answer"}
        className="w-full bg-dark-5 rounded outline-none border-none resize-none"
        style={{ minHeight: "4rem" }}
        placeholder="Write here..."
        value={answer}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
      />
    </div>
  );
}
