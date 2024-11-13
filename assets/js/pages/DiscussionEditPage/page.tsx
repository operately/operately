import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { Form, useForm } from "@/features/DiscussionForm";

export function Page() {
  const { discussion } = useLoadedData();

  const form = useForm({ space: discussion.space!, discussion, mode: "edit" });

  return (
    <Pages.Page title={"Edit Post"} testId="discussion-edit-page">
      <Paper.Root>
        <Paper.Body>
          <Header form={form} />
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ form }) {
  return (
    <Paper.Banner className="justify-between py-4">
      <h1 className="text-xl font-extrabold">Editing the Post</h1>

      <div className="flex items-center gap-2">
        <SecondaryButton linkTo={form.cancelPath} size="sm" testId="cancel-edit">
          Cancel
        </SecondaryButton>

        <PrimaryButton onClick={form.submit} loading={form.submitting} size="sm" testId="save-changes">
          {form.submitButtonLabel}
        </PrimaryButton>
      </div>
    </Paper.Banner>
  );
}
