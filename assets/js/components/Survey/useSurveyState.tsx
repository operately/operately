import * as React from "react";

import { Question } from "./questions";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";

export interface YesNoWithCommentsState {
  id: string;
  type: "yes-no-with-comments";
  title: string;
  question: string;
  answer: "yes" | "no" | null;
  setAnswer: (answer: "yes" | "no" | null) => void;
  commentsEditor: TipTapEditor.Editor;
  ready: boolean;
  focused: boolean;
}

export interface TextAreaState {
  id: string;
  type: "text-area";
  title: string;
  question: string;
  answerEditor: TipTapEditor.Editor;
  ready: boolean;
  focused: boolean;
}

export type State = YesNoWithCommentsState | TextAreaState;

export function useSurveyState(questions: Question[]): State[] {
  return questions.map((q) => {
    switch (q.type) {
      case "yes_no_with_comments":
        return useYesNoQuestionState(q) as YesNoWithCommentsState;

      case "text_area":
        return useTextAreaQuestionState(q) as TextAreaState;
    }
  });
}

function useYesNoQuestionState(question: Question): YesNoWithCommentsState {
  const peopleSearch = People.usePeopleSearch();

  let { editor, submittable, focused } = TipTapEditor.useEditor({
    placeholder: "Leave a comment...",
    peopleSearch: peopleSearch,
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
  });

  let [answer, setAnswer] = React.useState<"yes" | "no" | null>(null);

  return {
    id: question.id,
    type: "yes-no-with-comments",
    title: question.title,
    question: question.question,
    answer: answer,
    setAnswer: setAnswer,
    commentsEditor: editor,
    ready: submittable,
    focused: focused,
  };
}

function useTextAreaQuestionState(question: Question): TextAreaState {
  const peopleSearch = People.usePeopleSearch();

  let { editor, submittable, focused } = TipTapEditor.useEditor({
    placeholder: "Write your answer...",
    peopleSearch: peopleSearch,
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
  });

  return {
    id: question.id,
    type: "text-area",
    title: question.title,
    question: question.question,
    answerEditor: editor,
    ready: submittable,
    focused: focused,
  };
}
