type YesNoQuestion = {
  name: string;
  title: string;
  question: string;
  type: "yes_no_with_comments";
};

type TextAreaQuestion = {
  name: string;
  title: string;
  question?: string;
  type: "text_area";
};

export type Question = YesNoQuestion | TextAreaQuestion;

export function yesNoQuestion(name: string, title: string, question: string): YesNoQuestion {
  return {
    name,
    title,
    question,
    type: "yes_no_with_comments",
  };
}

export function textAreaQuestion(name: string, title: string, question?: string): TextAreaQuestion {
  return {
    name,
    title,
    question,
    type: "text_area",
  };
}
