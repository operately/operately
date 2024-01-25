import * as React from "react";

import { Question } from "./questions";
import { useSurveyState, State, YesNoWithCommentsState, TextAreaState } from "./useSurveyState";
import * as TipTapEditor from "@/components/Editor";
import Button from "@/components/Button";
import { RadioGroup, Radio } from "@/components/Form";

type YesNoWithCommentsAnswer = {
  id: string;
  type: "yes-no-with-comments";
  title: string;
  answer: "yes" | "no";
  comments: string;
};

type TextAreaAnswer = {
  id: string;
  type: "text-area";
  answer: string;
};

export type Answer = YesNoWithCommentsAnswer | TextAreaAnswer;

interface SurveyFormProps {
  questions: Question[];
  onSubmit: (answers: Answer[]) => void;
  onCancel: () => void;
  loading: boolean;
}

export function SurveyForm({ questions, onSubmit, onCancel, loading }: SurveyFormProps): JSX.Element {
  const states = useSurveyState(questions);

  const ready = states.every((s) => s.ready);
  const uploading = states.some((s) => s.uploading);
  const buttonTitle = uploading ? "Uploading..." : "Submit";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ready) return;
    if (loading) return;

    const answers = states.map((s) => {
      switch (s.type) {
        case "yes-no-with-comments":
          return {
            id: s.id,
            type: "yes-no-with-comments",
            title: s.title,
            question: s.question,
            answer: s.answer === "yes" ? "yes" : "no",
            comments: JSON.stringify(s.commentsEditor.getJSON())!,
          } as YesNoWithCommentsAnswer;
        case "text-area":
          return {
            id: s.id,
            type: "text-area",
            title: s.title,
            question: s.question,
            answer: JSON.stringify(s.answerEditor.getJSON())!,
          } as TextAreaAnswer;
      }
    });

    onSubmit(answers);
  };

  return (
    <form onSubmit={handleSubmit} data-test-id="submit-area">
      {states.map((s) => (
        <SurveyQuestion key={s.id} state={s} />
      ))}

      <div className="flex items-center gap-2 mt-8">
        <Button
          variant="success"
          type="submit"
          disabled={!ready || uploading}
          loading={loading}
          data-test-id="submit-button"
        >
          {buttonTitle}
        </Button>

        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SurveyQuestion({ state }: { state: State }): JSX.Element {
  if (state.type === "yes-no-with-comments") {
    return <YesNoQuestionWithComments state={state} />;
  }

  if (state.type === "text-area") {
    return <TextAreaQuestion state={state} />;
  }

  throw new Error("Unknown question type: " + state);
}

function YesNoQuestionWithComments({ state }: { state: YesNoWithCommentsState }) {
  const id = state.id;
  const testId = "question-" + id;

  if (!state.commentsEditor) return <></>;

  const onAnswerChange = (value: string | null) => {
    state.setAnswer(value as "yes" | "no");
  };

  return (
    <div data-test-id={testId} className="mb-8">
      <div className="font-bold text-lg text-white-1">{state.title}</div>
      <p className="font-medium">{state.question}</p>
      <div className="flex items-center gap-2 mt-1 mb-2">
        <RadioGroup name={state.id} data-test-id={testId} defaultValue={null} onChange={onAnswerChange}>
          <Radio label="Yes" name={state.id} value="yes" data-test-id={testId + "-yes"} />
          <br />
          <Radio label="No" name={state.id} value="no" data-test-id={testId + "-no"} />
        </RadioGroup>
      </div>

      <EditorView editor={state.commentsEditor} focused={state.focused} />
    </div>
  );
}

function TextAreaQuestion({ state }: { state: TextAreaState }) {
  const testId = "question-" + state.id;

  if (!state.answerEditor) return <></>;

  return (
    <div data-test-id={testId}>
      <div className="font-bold text-lg">{state.title}</div>
      <div className="font-medium mb-2">{state.question}</div>
      <EditorView editor={state.answerEditor} focused={state.focused} />
    </div>
  );
}

function EditorView({ editor, focused }: { editor: TipTapEditor.Editor; focused?: boolean }) {
  return (
    <TipTapEditor.Root editor={editor}>
      <div className="bg-dark-2 rounded overflow-hidden relative">
        <TipTapEditor.EditorContent editor={editor} />

        <div className="flex flex-row-reverse p-2 transition-opacity duration-200" style={{ opacity: focused ? 1 : 0 }}>
          <TipTapEditor.Toolbar editor={editor} />
        </div>
      </div>
    </TipTapEditor.Root>
  );
}
