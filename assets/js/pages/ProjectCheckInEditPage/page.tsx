import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Form, useForm } from "@/features/projectCheckIns/Form";
import { FilledButton } from "@/components/Button";
import { useLoadedData } from "./loader";

import FormattedTime from "@/components/FormattedTime";

export function Page() {
  const { checkIn, project, me } = useLoadedData();

  const form = useForm({ project, checkIn, mode: "edit", author: me });

  return (
    <Pages.Page title={["Edit Project Check-In", project.name]}>
      <Paper.Root>
        <Paper.Body>
          <Header form={form} checkIn={checkIn} />
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ form, checkIn }) {
  return (
    <div className="">
      <Paper.Header className="bg-surface-dimmed">
        <div className="flex items-end justify-between mx-10 my-2">
          <h1 className="text-xl font-extrabold">
            Editing the Check-In from <FormattedTime time={checkIn.insertedAt} format="long-date" />
          </h1>

          <div className="flex items-center gap-2">
            <FilledButton type="secondary" linkTo={form.cancelPath} size="sm" testId="cancel-edit">
              Cancel
            </FilledButton>

            <FilledButton
              type="primary"
              onClick={form.submit}
              loading={form.submitting}
              size="sm"
              testId="save-changes"
              bzzzOnClickFailure
            >
              {form.submitButtonLabel}
            </FilledButton>
          </div>
        </div>
      </Paper.Header>
    </div>
  );
}
