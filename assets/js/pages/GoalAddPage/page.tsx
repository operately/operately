import React from "react";

import classnames from "classnames";
import PeopleSearch from "@/components/PeopleSearch";

import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";
import * as People from "@/graphql/People";

import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { AddTarget, Target, TargetHeader } from "./Target";
import { useLoadedData } from "./loader";
import { FormState, useForm } from "./useForm";

export function Page() {
  const { company, space, me } = useLoadedData();
  const form = useForm(company, me);

  return (
    <Pages.Page title="New Goal">
      <Paper.Root size="medium">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={`/spaces/${form.fields.spaceID}/goals`}>Back to {space.name} Space</DimmedLink>
        </div>

        <h1 className="mb-4 font-bold text-3xl text-center">Adding a new goal for {space.name}</h1>

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
          testId="add-goal-button"
          bzzzOnClickFailure
        >
          Add Goal
        </FilledButton>
      </div>
    </div>
  );
}

function Form({ form }: { form: FormState }) {
  const placeholders = [["e.g. Avarage Onboarding Time is twice as fast", "30", "15", "minutes"]];

  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} onCancel={form.cancel} isValid={true}>
      <div className="font-medium">
        <span className="font-bold text-lg">Goal</span>
        <div className="mt-3 mb-12 text-lg">
          <GoalName form={form} />
        </div>

        <div className="font-bold text-lg">Measurments</div>
        <div className="mt-1 text-sm text-content-dimmed">How will you know that you succeded?</div>
        <div className="mt-4">
          <TargetHeader />
          {form.fields.targets.map((target, index) => (
            <Target key={index} form={form} index={index} target={target} placeholders={placeholders[index] || []} />
          ))}
          <AddTarget form={form} />
        </div>
      </div>

      <Paper.DimmedSection>
        <div className="flex items-center gap-6">
          <div className="w-1/3">
            <ContributorSearch
              title="Champion"
              onSelect={form.fields.setChampion}
              defaultValue={form.fields.champion}
              error={form.errors.find((e) => e.field === "champion")}
              inputId="champion-search"
            />
          </div>

          <div className="w-1/3">
            <ContributorSearch
              title="Reviewer"
              onSelect={form.fields.setReviewer}
              defaultValue={form.fields.reviewer}
              inputId="reviewer-search"
              error={form.errors.find((e) => e.field === "reviewer")}
            />
          </div>

          <div className="w-1/3">
            <TimeframeSelector form={form} />
          </div>
        </div>
      </Paper.DimmedSection>
    </Forms.Form>
  );
}

function GoalName({ form }: { form: FormState }) {
  const className = classnames(
    "border-b border-surface-outline",
    "px-0 py-1",
    "w-full",
    "placeholder:text-content-subtle",
    "focus:bg-surface-highlight bg-transparent",
    {
      "bg-red-400/10": form.errors.find((e) => e.field === "name"),
    },
  );

  return (
    <input
      className={className}
      autoFocus
      placeholder="e.g. Improve product onboarding"
      value={form.fields.name}
      onChange={(e) => form.fields.setName(e.target.value)}
      data-test-id="goal-name"
    />
  );
}

function TimeframeSelector({ form }: { form: FormState }) {
  return (
    <Forms.SelectBox
      label="Timeframe"
      value={form.fields.timeframe}
      onChange={form.fields.setTimeframe}
      options={form.fields.timeframeOptions}
      defaultValue={form.fields.timeframeOptions[0]}
    />
  );
}

function ContributorSearch({ title, onSelect, defaultValue, inputId, error }: any) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-semibold block mb-1">{title}</label>
      <div className="flex-1">
        <PeopleSearch
          onChange={(option) => onSelect(option?.person)}
          defaultValue={defaultValue}
          placeholder="Search for person..."
          inputId={inputId}
          loader={loader}
          error={!!error}
        />
      </div>
    </div>
  );
}
