import { Question } from "./questions";

export type YesNoAnswer = {
  answer: "yes" | "no";
  comments: string;
};

export type TextAreaAnswer = {
  answer: string;
};

export type Answer = YesNoAnswer | TextAreaAnswer;
export type Answers = Record<string, Answer>;

export function buildEmptyAnswers(questions: Question[]): Answers {
  return questions.reduce((acc, question: Question) => {
    if (question.type === "yes_no_with_comments") {
      return {
        ...acc,
        [question.name]: {
          answer: "",
          comments: "",
        },
      };
    } else if (question.type === "text_area") {
      return {
        ...acc,
        [question.name]: {
          answer: "",
        },
      };
    }

    throw new Error("Unknown question type: ");
  }, {});
}
