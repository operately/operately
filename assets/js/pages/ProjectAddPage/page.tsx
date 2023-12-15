import React from "react";

import * as Paper from "@/components/PaperContainer";

import PeopleSearch from "@/components/PeopleSearch";

import * as People from "@/graphql/People";
import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";
import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";

export function Page() {
  const { company, space, me } = useLoadedData();
  const form = useForm(company, space.id, me);

  return (
    <Pages.Page title="New Project">
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={`/spaces/${form.fields.spaceID}/goals`}>Back to {space.name} Space</DimmedLink>
        </div>

        <h1 className="mb-4 font-bold text-3xl text-center">Start a new project in {space.name}</h1>

        <Paper.Body minHeight="300px">
          <Form form={form} />
        </Paper.Body>

        <SubmitButton form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ form }: { form: FormState }) {
  return (
    <div className="mt-8">
      {form.errors.length > 0 && (
        <div className="text-red-500 text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}

      <div className="flex items-center justify-center gap-4">
        <FilledButton
          type="primary"
          onClick={form.submit}
          loading={form.submitting}
          size="lg"
          testId="save"
          bzzzOnClickFailure
        >
          Add Project
        </FilledButton>
      </div>
    </div>
  );
}

function Form({ form }: { form: FormState }) {
  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} isValid={true} onCancel={form.cancel}>
      <div className="flex flex-col gap-8">
        <Forms.TextInput
          autoFocus
          label="Project Name"
          value={form.fields.name}
          onChange={form.fields.setName}
          placeholder="e.g. HR System Update"
          data-test-id="project-name-input"
          error={form.errors.find((e) => e.field === "name")?.message}
        />

        <ContributorSearch title="Champion" onSelect={form.fields.setChampion} defaultValue={form.fields.champion} />
        {form.fields.champion?.id !== form.fields.me.id && (
          <Forms.SelectBox
            label="What is your role on this project?"
            value={form.fields.creatorRole}
            onChange={form.fields.setCreatorRole}
            allowEnteringNewValues
            options={[
              { value: "Reviewer", label: "Reviewer" },
              { value: "Project Manager", label: "Project Manager" },
              { value: "Product Manager", label: "Product Manager" },
              { value: "Designer", label: "Designer" },
              { value: "Developer", label: "Developer" },
              { value: "QA", label: "QA" },
            ]}
            defaultValue="Reviewer"
            data-test-id="your-role-input"
          />
        )}
        <Forms.RadioGroupWithLabel
          label="Who can see this project?"
          name="visibility"
          defaultValue="everyone"
          onChange={form.fields.setVisibility}
        >
          <Forms.RadioWithExplanation
            label="All-Access"
            explanation={"Anyone from " + form.fields.company.name + " can see this project"}
            value="everyone"
          />
          <Forms.RadioWithExplanation
            label={"Invite-only"}
            explanation={"Only people you invite can see this project"}
            value="invite"
            data-test-id="invite-only"
          />
        </Forms.RadioGroupWithLabel>
      </div>
    </Forms.Form>
  );
}

function ContributorSearch({ title, onSelect, defaultValue }) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-bold mb-1 block">{title}</label>
      <div className="flex-1">
        <PeopleSearch
          onChange={(option) => onSelect(option?.person)}
          defaultValue={defaultValue}
          placeholder="Search by name ..."
          loader={loader}
        />
      </div>
    </div>
  );
}
