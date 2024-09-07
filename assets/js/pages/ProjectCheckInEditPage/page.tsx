import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";

import { Form, useForm } from "@/features/projectCheckIns/Form";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { useLoadedData } from "./loader";

import FormattedTime from "@/components/FormattedTime";
import { useMe } from "@/contexts/CurrentUserContext";
import { ProjectCheckIn } from "@/api";

export function Page() {
  const me = useMe()!;
  const { checkIn } = useLoadedData();

  const form = useForm({ checkIn, mode: "edit", author: me });

  return (
    <Pages.Page title={["Edit Project Check-In", checkIn.project!.name!]}>
      <Paper.Root>
        <Paper.Body>
          <Header form={form} checkIn={checkIn} />
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ form, checkIn }: { form: ReturnType<typeof useForm>; checkIn: ProjectCheckIn }) {
  return (
    <div className="">
      <Paper.Header className="bg-surface-dimmed">
        <div className="flex items-end justify-between my-2">
          <h1 className="text-xl font-extrabold">
            Editing the Check-In from <FormattedTime time={checkIn.insertedAt!} format="long-date" />
          </h1>

          <div className="flex items-center gap-2">
            <SecondaryButton linkTo={form.cancelPath} size="sm" testId="cancel-edit">
              Cancel
            </SecondaryButton>

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
