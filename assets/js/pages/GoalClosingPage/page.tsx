import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import Forms from "@/components/Forms";

import { Paths } from "@/routes/paths";
import { BlackLink } from "@/components/Link";
import { WarningCallout } from "@/components/Callouts";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";

export function Page() {
  const { goal } = useLoadedData();

  return (
    <Pages.Page title={"Closing " + goal.name}>
      <Paper.Root>
        <Navigation />

        <Paper.Body minHeight="none">
          <PageTitle />
          <ActiveSubitemsWarning />
          <Form />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const { goal } = useLoadedData();

  const [close] = Goals.useCloseGoal();
  const navigateToGoal = useNavigateTo(Paths.goalPath(goal.id!));

  const form = Forms.useForm({
    fields: {
      success: "yes",
      retrospective: "",
    },
    submit: async () => {
      await close({
        goalId: goal.id,
        success: form.values.success,
        retrospective: JSON.stringify(form.values.retrospective),
      });
      navigateToGoal();
    },
    cancel: navigateToGoal,
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <AccomplishedOrDropped />
        <RetrospectiveNotes />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Close Goal" />
    </Forms.Form>
  );
}

function AccomplishedOrDropped() {
  return (
    <Forms.RadioButtons
      field="success"
      label="Was this goal accomplished or dropped?"
      options={[
        { value: "yes", label: "Accomplished" },
        { value: "no", label: "Dropped" },
      ]}
    />
  );
}

function RetrospectiveNotes() {
  const { goal } = useLoadedData();

  return (
    <Forms.RichTextArea
      field="retrospective"
      label="Retrospective notes"
      mentionSearchScope={{ type: "goal", id: goal.id! }}
      placeholder="What went well? What didn't? What did you learn?"
      required
    />
  );
}

function Navigation() {
  const { goal } = useLoadedData();

  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.goalPath(goal.id!)}>{goal.name}</Paper.NavItem>
    </Paper.Navigation>
  );
}

function PageTitle() {
  return <div className="text-content-accent text-2xl font-extrabold">Review &amp; Close Goal</div>;
}

function ActiveSubitemsWarning() {
  return (
    <div className="my-6">
      <WarningCallout
        message="This goal contains 3 active sub-goals and 1 project that will remain active:"
        description={
          <div>
            <ul className="flex flex-col gap-1 mt-2">
              <li>
                <BlackLink to={Paths.goalPath("123")}>Document core business processes in company playbook</BlackLink>
              </li>
              <li>
                <BlackLink to={Paths.goalPath("123")}>Ensure Financial Stability</BlackLink>
              </li>
              <li>
                <BlackLink to={Paths.projectPath("123")}>Expand team capbilities</BlackLink>
              </li>
              <li>
                <BlackLink to={Paths.projectPath("123")}>Website Redesign</BlackLink>
              </li>
            </ul>
          </div>
        }
      />
    </div>
  );
}
