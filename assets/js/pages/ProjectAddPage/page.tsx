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
          <DimmedLink to={`/spaces/${form.fields.spaceID}/projects`}>Back to {space.name} Space</DimmedLink>
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
  const showWillYouContribute = !form.fields.amIChampion && !form.fields.amIReviewer;

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
          error={!!form.errors.find((e) => e.field === "name")?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <ContributorSearch
            title="Champion"
            onSelect={form.fields.setChampion}
            defaultValue={form.fields.champion}
            error={!!form.errors.find((e) => e.field === "champion")?.message}
          />
          <ContributorSearch
            title="Reviewer"
            onSelect={form.fields.setReviewer}
            defaultValue={form.fields.reviewer}
            error={!!form.errors.find((e) => e.field === "reviewer")?.message}
          />
        </div>

        {showWillYouContribute && (
          <div>
            <div className="font-bold">Will you contribute?</div>

            <Forms.RadioGroup
              name="creatorIsContributor"
              defaultValue={form.fields.creatorIsContributor}
              onChange={form.fields.setCreatorIsContributor}
            >
              <div className="flex flex-col gap-1 mt-3">
                <Forms.Radio
                  label={"No, I'm just setting it up for someone else"}
                  value="no"
                  data-test-id="no-contributor"
                />
                <Forms.Radio label="Yes, I'll contribute" value="yes" data-test-id="yes-contributor" />
              </div>
            </Forms.RadioGroup>

            {form.fields.creatorIsContributor === "yes" && (
              <div className="mt-4">
                <Forms.TextInput
                  label="What is your responsibility on this project?"
                  value={form.fields.creatorRole}
                  onChange={form.fields.setCreatorRole}
                  placeholder="e.g. Responsible for managing the project and coordinating tasks"
                  data-test-id="creator-responsibility-input"
                  error={!!form.errors.find((e) => e.field === "creatorRole")?.message}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Paper.DimmedSection>
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

        {form.fields.noAccess && (
          <div className="font-medium mt-8 pt-4 flex flex-col text-center border-t border-stroke-base">
            <div className="font-bold mb-2">Are you sure?</div>
            Access to this project is invite-only and restricted to contributors. You will not have access. The champion
            and reviewer will be informed.
          </div>
        )}
      </Paper.DimmedSection>
    </Forms.Form>
  );
}

function ContributorSearch({ title, onSelect, defaultValue, error }: any) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-bold mb-1 block">{title}</label>
      <div className="flex-1">
        <PeopleSearch
          onChange={(option) => onSelect(option?.person)}
          defaultValue={defaultValue}
          placeholder="Search by name..."
          loader={loader}
          inputId={title}
          error={error}
        />
      </div>
    </div>
  );
}
