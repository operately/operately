import React from "react";

import * as Paper from "@/components/PaperContainer";

import PeopleSearch from "@/components/PeopleSearch";

import * as People from "@/graphql/People";
import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";
import Button from "@/components/Button";
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

function Form({ form }) {
  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} isValid={form.isValid} onCancel={form.cancel}>
      <div className="font-medium">
        <span className="font-bold text-lg">Goal</span>
        <div className="mt-3 mb-12 text-lg">
          <TextInput form={form} autoFocus={true} placeholder="e.g. Improve product onboarding" />
        </div>
        <span className="font-bold text-lg">Targets</span>
        <div className="mt-4">
          <TargetHeader />
          {form.targetList.targets.map((target, index) => (
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
        <div className="font-bold text-lg mt-12">People</div>
        TODO
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton data-test-id="save">Add Goal</Forms.SubmitButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}

function TextInput({ form, autoFocus = false, placeholder }) {
  return (
    <input
      className="border-b border-surface-outline px-0 py-1 w-full placeholder:text-content-subtle focus:bg-surface-highlight bg-transparent"
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}

function TextInput2({ form, autoFocus = false, placeholder }) {
  return (
    <input
      className="px-0 py-1 w-full group-hover:bg-surface-highlight"
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}

function TimeframeSelector({ form }) {
  return (
    <div className="bg-surface-highlight rounded-md px-1 text-lg border border-stroke-base inline-flex items-center gap-1">
      2023 Q4
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
