import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

import { useLoadedData } from "./loader";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import { Form, useForm } from "@/features/DiscussionForm";

export function Page() {
  const { discussion } = useLoadedData();

  const form = useForm({ space: discussion.space as Spaces.Space, discussion, mode: "edit" });

  return (
    <Pages.Page title={"Edit Post"}>
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
    <div className="">
      <Paper.Header className="bg-surface-dimmed">
        <div className="flex items-end justify-between my-2">
          <h1 className="text-xl font-extrabold">Editing the Post</h1>

          <div className="flex items-center gap-2">
            <GhostButton type="secondary" linkTo={form.cancelPath} size="sm" testId="cancel-edit">
              Cancel
            </GhostButton>

            <PrimaryButton
              onClick={form.submit}
              loading={form.submitting}
              size="sm"
              testId="save-changes"
              bzzzOnClickFailure
            >
              {form.submitButtonLabel}
            </PrimaryButton>
          </div>
        </div>
      </Paper.Header>
    </div>
  );
}
