import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Form, useForm } from "@/features/ProjectCheckInForm";
import { FilledButton } from "@/components/Button";
import { useLoadedData } from "./loader";

export function Page() {
  const data = useLoadedData();

  const project = { name: "Project Name" };
  const form = useForm(project);

  const checkin = { insertedAt: "Jan 27th" };

  return (
    <Pages.Page title={["Edit Project Check-In", project.name]}>
      <Paper.Root>
        <Paper.Body>
          <Header form={form} checkin={checkin} />
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ form, checkin }) {
  return (
    <div className="">
      <Paper.Header className="bg-surface-dimmed">
        <div className="flex items-end justify-between mx-10 my-2">
          <h1 className="text-xl font-extrabold">Editing the Check-in from {checkin.insertedAt}</h1>

          <div className="flex items-center gap-2">
            <FilledButton type="secondary" onClick={form.cancel} size="sm" testId="cancel-edit">
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
              Save Changes
            </FilledButton>
          </div>
        </div>
      </Paper.Header>
    </div>
  );
}
