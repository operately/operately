import React from "react";

import classnames from "classnames";
import PeopleSearch from "@/components/PeopleSearch";

import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import * as People from "@/models/people";
import * as TipTapEditor from "@/components/Editor";

import { GhostButton } from "@/components/Button";
import { AddTarget, Target, TargetHeader } from "./Target";
import { FormState } from "./useForm";
import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";
import { TimeframeSelector } from "@/components/TimeframeSelector";

export function Form({ form }: { form: FormState }) {
  return (
    <Forms.Form onSubmit={form.submit} loading={form.submitting} onCancel={form.cancel} isValid={true}>
      <FormMain form={form} />
      <FormFooter form={form} />
    </Forms.Form>
  );
}

function FormMain({ form }: { form: FormState }) {
  return (
    <div className="font-medium">
      <SectionHeader form={form} title={form.config.mode === "create" ? "Goal" : "Name"} />

      <div className="mb-12 text-lg">
        <GoalName form={form} />
        <AddDescription form={form} />
      </div>

      <Description form={form} />
      <ParentGoal form={form} />
      <TargetSection form={form} />
    </div>
  );
}

function TargetSection({ form }: { form: FormState }) {
  const placeholders = [["e.g. Avarage Onboarding Time is twice as fast", "30", "15", "minutes"]];

  return (
    <>
      <SectionHeader form={form} title="Success Conditions" subtitle="How will you know that you succeded?" />

      {form.errors.find((e) => e.field === "targets") && (
        <div className="text-red-500 text-sm">At least one success condition is required</div>
      )}

      <div className="mt-4">
        <TargetHeader />
        {form.fields.targets.map((target, index) => (
          <Target key={index} form={form} index={index} target={target} placeholders={placeholders[index] || []} />
        ))}
        <AddTarget form={form} />
      </div>
    </>
  );
}

function Description({ form }: { form: FormState }) {
  if (!form.fields.hasDescription) return null;

  return (
    <div className="mb-12">
      <SectionHeader form={form} title="Description" subtitle="Add more context to your goal (optional)" />

      <TipTapEditor.Root editor={form.fields.descriptionEditor}>
        <div className="border-x border-b border-stroke-base flex-1">
          <TipTapEditor.Toolbar editor={form.fields.descriptionEditor} />
          <TipTapEditor.EditorContent editor={form.fields.descriptionEditor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}

function FormFooter({ form }: { form: FormState }) {
  const bottomGridStyle = classnames({
    "grid grid-cols-1 sm:grid-cols-2 gap-4": true,
    "lg:grid-cols-3": !form.config.allowSpaceSelection,
    "lg:grid-cols-4": form.config.allowSpaceSelection,
  });

  return (
    <Paper.DimmedSection>
      <div className={bottomGridStyle}>
        <div>
          <label className="font-semibold block mb-1">Timeframe</label>
          <TimeframeSelector timeframe={form.fields.timeframe} setTimeframe={form.fields.setTimeframe} />
        </div>

        <div>
          <ContributorSearch
            title="Champion"
            onSelect={form.fields.setChampion}
            defaultValue={form.fields.champion}
            error={form.errors.find((e) => e.field === "champion")}
            inputId="champion-search"
          />
        </div>

        <div>
          <ContributorSearch
            title="Reviewer"
            onSelect={form.fields.setReviewer}
            defaultValue={form.fields.reviewer}
            inputId="reviewer-search"
            error={form.errors.find((e) => e.field === "reviewer")}
          />
        </div>

        {form.config.allowSpaceSelection && (
          <div className="basis-1/4">
            <SpaceSelector form={form} />
          </div>
        )}
      </div>
    </Paper.DimmedSection>
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
      autoFocus
      className={className}
      placeholder="e.g. Improve product onboarding"
      value={form.fields.name}
      onChange={(e) => form.fields.setName(e.target.value)}
      data-test-id="goal-name"
    />
  );
}

function SpaceSelector({ form }: { form: FormState }) {
  const hasError = !!form.errors.find((e) => e.field === "space");

  return (
    <Forms.SelectBox
      label="Space"
      value={form.fields.space}
      onChange={form.fields.setSpace}
      options={form.fields.spaceOptions}
      defaultValue={null}
      error={hasError}
      data-test-id="space-selector"
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

function ParentGoal({ form }: { form: FormState }) {
  if (form.config.isCompanyWide) return null;
  if (form.config.mode === "edit") return null;

  return (
    <div className="mb-12">
      <SectionHeader form={form} title="Parent Goal" />

      <div className="mt-2"></div>
      <GoalSelectorDropdown
        selected={form.fields.parentGoal}
        goals={form.config.parentGoalOptions!}
        onSelect={form.fields.setParentGoal}
        error={!!form.errors.find((e) => e.field === "parentGoal")}
      />
    </div>
  );
}

function SectionHeader({ form, title, subtitle }: { form: FormState; title: string; subtitle?: string }) {
  const headerTextSize = form.config.mode === "create" ? "text-lg" : "";

  return (
    <div className="">
      <div className={`font-bold ${headerTextSize}`}>{title}</div>

      {subtitle && <div className="mt-1 text-sm text-content-dimmed">{subtitle}</div>}
    </div>
  );
}
