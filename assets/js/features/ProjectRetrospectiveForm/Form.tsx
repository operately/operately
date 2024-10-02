import React from "react";

import * as TipTapEditor from "@/components/Editor";

import { PrimaryButton } from "@/components/Buttons";
import { createTestId } from "@/utils/testid";
import { FormState } from "./useForm";
import { SubscribersSelector } from "@/features/Subscriptions";

export function Form({ form }: { form: FormState }) {
  return (
    <>
      <Question
        title="What went well?"
        editor={form.whatWentWell.editor}
        error={form.errors.find((e) => e.field === "whatWentWell")}
      />
      <Question
        title="What could've gone better?"
        editor={form.whatCouldHaveGoneBetter.editor}
        error={form.errors.find((e) => e.field === "whatCouldHaveGoneBetter")}
      />
      <Question
        title="What did you learn?"
        editor={form.whatDidYouLearn.editor}
        error={form.errors.find((e) => e.field === "whatDidYouLearn")}
      />

      {form.mode === "create" && (
        <SubscribersSelector state={form.subscriptionsState} projectName={form.project!.name!} />
      )}

      <SubmitButton form={form} />
    </>
  );
}

function Question({ title, editor, error }) {
  const testId = createTestId(title);

  return (
    <div className="" data-test-id={testId}>
      <h2 className="text-content-accent text font-bold mb-1">{title}</h2>
      {error && <div className="text-sm text-content-error mb-2 font-medium">Please fill in this field</div>}

      <div className="border-x border-stroke-base">
        <TipTapEditor.Root editor={editor}>
          <TipTapEditor.Toolbar editor={editor} />

          <div className="mb-8 text-content-accent relative border-b border-stroke-base px-2">
            <TipTapEditor.EditorContent editor={editor} />
          </div>
        </TipTapEditor.Root>
      </div>
    </div>
  );
}

function SubmitButton({ form }: { form: FormState }) {
  return (
    <div className="flex justify-center mt-8">
      <PrimaryButton size="lg" onClick={form.submit} testId="submit">
        {form.mode === "create" ? "Submit & Close Project" : "Save"}
      </PrimaryButton>
    </div>
  );
}
