import * as React from "react";

import { FormState } from "./useForm";
import { FormTitleInput } from "@/components/FormTitleInput";
import { Editor } from "turboui";

export function Form({ form }: { form: FormState }) {
  return (
    <>
      <FormTitleInput
        testId="discussion-title"
        value={form.title}
        onChange={form.setTitle}
        error={!!form.errors.find((e) => e.field === "title")}
      />
      <Message editor={form.editor} />
    </>
  );
}

function Message({ editor }) {
  return (
    <div className="text-lg">
      <Editor editor={editor} hideBorder padding="p-0" />
    </div>
  );
}
