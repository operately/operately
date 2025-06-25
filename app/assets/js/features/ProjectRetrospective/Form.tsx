import React from "react";

import * as TipTapEditor from "@/components/Editor";

import { PrimaryButton } from "turboui";
import { FormState } from "./useForm";
import { SubscribersSelector } from "@/features/Subscriptions";

export function Form({ form }: { form: FormState }) {
  return (
    <>
      <RetrospectiveNotes
        editor={form.retrospectiveNotes.editor}
        error={form.errors.find((e) => e.field === "retrospectiveNotes")}
      />

      {form.mode === "create" && (
        <SubscribersSelector state={form.subscriptionsState} projectName={form.project!.name!} />
      )}

      <SubmitButton form={form} />
    </>
  );
}

function RetrospectiveNotes({ editor, error }) {
  return (
    <div data-test-id="retrospective-notes">
      <h2 className="text-content-accent text font-bold mb-1">Retrospective notes</h2>
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
