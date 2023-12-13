import React from "react";
import classnames from "classnames";

import * as Paper from "@/components/PaperContainer";

import PeopleSearch from "@/components/PeopleSearch";

import * as People from "@/graphql/People";
import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";
import { Target, TargetHeader, AddTarget } from "./Target";
import { FilledButton, GhostButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";

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
    <div className="flex items-center justify-center mt-8 gap-4">
      <FilledButton type="primary" onClick={form.submit} loading={form.submitting} size="lg">
        Add Goal
      </FilledButton>

      <GhostButton type="primary" onClick={form.submit} loading={form.submitting} size="lg">
        Save & Add Another
      </GhostButton>
    </div>
  );
}

function Form({ form }: { form: FormState }) {
  const placeholders = [
    ["e.g. Avarage Onboarding Time is twice as fast", "30", "15", "minutes"],
    ["e.g. ", "30", "15", "minutes"],
    []
  ];

  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} isValid={form.isValid} onCancel={form.cancel}>
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
            <Target
              key={index}
              form={form}
              index={index}
              target={target}
              placeholders={index === 0 ?  : []}
            />
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
              inputId="champion"
            />
          </div>

          <div className="w-1/3">
            <ContributorSearch
              title="Reviewer"
              onSelect={form.fields.setReviewer}
              defaultValue={form.fields.reviewer}
              inputId="reviewer"
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

function GoalName({ form }) {
  const className = classnames(
    "border-b border-surface-outline",
    "px-0 py-1",
    "w-full",
    "placeholder:text-content-subtle",
    "focus:bg-surface-highlight bg-transparent",
  );

  return (
    <input
      className={className}
      autoFocus
      placeholder="e.g. Improve product onboarding"
      value={form.name}
      onChange={form.setName}
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

function ContributorSearch({ title, onSelect, defaultValue, inputId }) {
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
        />
      </div>
    </div>
  );
}
