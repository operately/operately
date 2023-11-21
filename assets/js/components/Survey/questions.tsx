type YesNoQuestion = {
  id: string;
  title: string;
  question: string;
  type: "yes_no_with_comments";
};

type TextAreaQuestion = {
  id: string;
  title: string;
  question: string;
  type: "text_area";
};

export type Question = YesNoQuestion | TextAreaQuestion;

export function yesNoQuestion(id: string, title: string, question: string): YesNoQuestion {
  return {
    id,
    title,
    question,
    type: "yes_no_with_comments",
  };
}

export function textAreaQuestion(id: string, title: string, question: string): TextAreaQuestion {
  return {
    id,
    title,
    question,
    type: "text_area",
  };
}
