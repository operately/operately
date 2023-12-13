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

export function Page() {
  const { company, me } = useLoadedData();
  const form = useForm(company, me);

  return (
    <Pages.Page title="New Goal">
      <Paper.Root size="medium">
        <h1 className="mb-4 font-bold text-3xl text-center">Adding a new goal</h1>

        <Paper.Body minHeight="300px">
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ form }: { form: FormState }) {
  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} isValid={form.isValid} onCancel={form.cancel}>
      <div className="font-medium">
        <span className="font-bold text-lg">Goal</span>
        <div className="mt-3 mb-12 text-lg">
          <GoalName form={form} />
        </div>
        <span className="font-bold text-lg">Targets</span>
        <div className="mt-4">
          <TargetHeader />
          {form.fields.targets.map((target, index) => (
            <Target
              key={index}
              form={form}
              index={index}
              target={target}
              placeholders={index === 0 ? ["e.g. Reduce Average Onboarding Time", "30", "15", "minutes"] : []}
            />
          ))}
          <AddTarget form={form} />
        </div>
      </div>

      <Paper.DimmedSection>
        <div className="flex items-center gap-6">
          <div className="w-1/3 mt-4">
            <ContributorSearch
              title="Champion"
              onSelect={form.fields.setChampion}
              defaultValue={form.fields.champion}
              inputId="champion"
            />
          </div>

          <div className="w-1/3 mt-4">
            <ContributorSearch
              title="Reviewer"
              onSelect={form.fields.setReviewer}
              defaultValue={form.fields.reviewer}
              inputId="reviewer"
            />
          </div>

          <div className="w-1/3 mt-4">
            <TimeframeSelector form={form} />
          </div>
        </div>

        <Forms.SubmitArea>
          <Forms.SubmitButton data-test-id="save">Add Goal</Forms.SubmitButton>
        </Forms.SubmitArea>
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
      autoFocus={true}
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
          placeholder="Search by name or title..."
          inputId={inputId}
          loader={loader}
        />
      </div>
    </div>
  );
}
