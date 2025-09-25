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
      <Message editor={form.editor} form={form} />
    </>
  );
}

function Message({ form, editor }: { form: FormState; editor: any }) {
  const error = React.useMemo(() => {
    const bodyError = form.errors.find((e) => e.field === "body");
    return bodyError?.message;
  }, [form.errors])

  return (
    <div className="text-lg">
      <Editor editor={editor} hideBorder padding="p-0" error={error} />
    </div>
  );
}
