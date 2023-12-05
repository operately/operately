import React from "react";

import * as Paper from "@/components/PaperContainer";

import PeopleSearch from "@/components/PeopleSearch";

import * as People from "@/graphql/People";
import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";

export function Page() {
  const { company, me } = useLoadedData();
  const form = useForm(company, me);

  return (
    <Pages.Page title="New Goal">
      <Paper.Root size="small">
        <h1 className="mb-4 font-bold text-3xl text-center">Adding a new goal</h1>

        <Paper.Body minHeight="300px">
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ form }) {
  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} isValid={form.isValid} onCancel={form.cancel}>
      <div className="flex flex-col gap-6">
        <Forms.TextInput
          label="Name"
          value={form.name}
          onChange={form.setName}
          placeholder="e.g. Improve the onboarding experience"
          data-test-id="name-input"
        />

        <ContributorSearch
          title="Champion"
          subtitle="Leads the effort to reach this goal"
          onSelect={form.setChampion}
          defaultValue={form.me}
          inputId="champion-search"
        />

        <ContributorSearch
          title="Reviewer"
          subtitle="Reviews and acknowledges the completion of this goal"
          onSelect={form.setChampion}
          defaultValue={null}
          inputId="reviewer-search"
        />

        <TimeframeSelector form={form} />
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save">Add Goal</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}

function TimeframeSelector({ form }) {
  return (
    <div className="flex flex-col">
      <label className="font-bold mb-1 block">Timeframe</label>

      <div className="flex items-center gap-4">
        <Forms.SelectBoxNoLabel
          value={form.timeframe.year.selected}
          onChange={form.timeframe.year.setSelected}
          options={form.timeframe.year.options}
          defaultValue={form.timeframe.year.default}
        />
        <Forms.SelectBoxNoLabel
          value={form.timeframe.quarter.selected}
          onChange={form.timeframe.quarter.setSelected}
          options={form.timeframe.quarter.options}
          defaultValue={form.timeframe.quarter.default}
        />
      </div>
    </div>
  );
}

function ContributorSearch({ title, subtitle, onSelect, defaultValue, inputId }) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-bold block">{title}</label>
      <div className="text-sm text-content-secondary mb-2">{subtitle}</div>
      <div className="flex-1">
        <PeopleSearch
          onChange={(option) => onSelect(option?.value)}
          defaultValue={defaultValue}
          placeholder="Search by name or title..."
          inputId={inputId}
          loader={loader}
        />
      </div>
    </div>
  );
}
