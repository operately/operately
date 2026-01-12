import * as React from "react";

import Forms from "@/components/Forms";
import { FormState } from "./useForm";

export function Form({ form, children }: { form: FormState; children?: React.ReactNode }) {
  const mentionSearchScope = { type: "space", id: form.space.id } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <div>
          <Forms.TitleInput
            field="title"
            placeholder="Title..."
            autoFocus
            testId="discussion-title"
            errorMessage="Please add a title"
          />
          <Forms.RichTextArea
            field="body"
            mentionSearchScope={mentionSearchScope}
            placeholder="Write here..."
            hideBorder
            height="min-h-[350px]"
            fontSize="text-lg"
            horizontalPadding="px-1"
            verticalPadding="py-2"
          />
        </div>
      </Forms.FieldGroup>

      {children}
    </Forms.Form>
  );
}
