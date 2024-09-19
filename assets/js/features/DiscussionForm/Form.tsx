import * as React from "react";
import * as TipTapEditor from "@/components/Editor";

import { Spacer } from "@/components/Spacer";
import { FormState } from "./useForm";
import { FormTitleInput } from "@/components/FormTitleInput";
import { SubscribersSelector } from "@/features/Subscriptions";

export function Form({ form }: { form: FormState }) {
  return (
    <>
      <FormTitleInput
        testId="discussion-title"
        value={form.title}
        onChange={form.setTitle}
        error={!!form.errors.find((e) => e.field === "name")}
      />
      <Message editor={form.editor} />
      <Spacer size={4} />

      {form.mode === "create" && <SubscribersSelector state={form.subscriptionsState} spaceName={form.space.name!} />}
    </>
  );
}

function Message({ editor }) {
  return (
    <div className="text-lg">
      <TipTapEditor.Root editor={editor}>
        <TipTapEditor.Toolbar editor={editor} />

        <div
          className="mb-8 text-content-base font-medium relative border-b border-shade-2"
          style={{ minHeight: "350px" }}
        >
          <TipTapEditor.EditorContent editor={editor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
