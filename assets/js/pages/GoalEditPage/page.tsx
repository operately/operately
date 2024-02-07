import React from "react";

import classnames from "classnames";
import PeopleSearch from "@/components/PeopleSearch";

import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";
import * as People from "@/graphql/People";
import * as TipTapEditor from "@/components/Editor";

import { FilledButton, GhostButton } from "@/components/Button";
import { AddTarget, Target, TargetHeader } from "./Target";
import { useLoadedData } from "./loader";
import { FormState, useForm } from "./useForm";

export function Page() {
  const { company, me } = useLoadedData();
  const form = useForm(company, me);

  return (
    <Pages.Page title={["Edit", form.fields.goal.name]}>
      <Paper.Root size="medium">
        <Paper.Body minHeight="300px">
          <Header form={form} />
          <Form form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Header({ form }: { form: FormState }) {
  return (
    <div className="">
      <Paper.Header className="bg-surface-dimmed">
        <div className="flex items-end justify-between mx-10 my-2">
          <h1 className="text-xl font-extrabold">Editing the goal</h1>

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

      {form.errors.length > 0 && (
        <div className="text-red-500 text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}
    </div>
  );
}

function Form({ form }: { form: FormState }) {
  const placeholders = [["e.g. Avarage Onboarding Time is twice as fast", "30", "15", "minutes"]];

  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} onCancel={form.cancel} isValid={true}>
      <div className="font-medium">
        <div className="font-bold mt-6">Title</div>
        <GoalName form={form} />
        <AddDescription form={form} />

        <Description form={form} />

        <div className="font-bold mt-12">Measurments</div>
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

function AddDescription({ form }: { form: FormState }) {
  if (form.fields.hasDescription) return null;

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      <GhostButton size="xxs" type="secondary" onClick={form.fields.setHasDescription}>
        Add Description
      </GhostButton>
    </div>
  );
}

function Description({ form }: { form: FormState }) {
  if (!form.fields.hasDescription) return null;

  return (
    <div className="mb-12 mt-12">
      <div className="font-bold">Description</div>
      <div className="text-sm text-content-dimmed mb-2">Add more context to your goal (optional)</div>

      <TipTapEditor.Root editor={form.fields.descriptionEditor}>
        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={form.fields.descriptionEditor} />
          <TipTapEditor.EditorContent editor={form.fields.descriptionEditor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
