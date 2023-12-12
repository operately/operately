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
          <div className="flex items-start gap-4 border-y border-surface-outline py-3">
            <div className="flex-1 flex items-center gap-4">
              <div className="w-8 pl-1">
                <Icons.IconHash className="text-content-base" size={16} />
              </div>

              <div className="flex-1 flex items-center gap-4">
                <div className="w-2/3 flex items-center">
                  <div className="text-xs font-bold">NAME</div>
                </div>

                <div className="w-12 flex items-center">
                  <div className="text-xs font-bold">FROM</div>
                </div>

                <div className="w-12 flex items-center relative">
                  <div className="text-xs font-bold">TO</div>
                </div>

                <div className="w-20 flex items-center relative">
                  <div className="text-xs font-bold">UNIT</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b border-surface-outline py-2">
            <div className="w-8">
              <Icons.IconCircle1Filled className="text-accent-1" size={24} />
            </div>

            <div className="flex-1 flex items-center gap-4">
              <div className="w-2/3 flex items-center relative">
                <TextInput2 form={form} placeholder="e.g. Reduce Average Onboarding Time" />
              </div>

              <div className="w-12 flex items-center relative">
                <TextInput2 form={form} placeholder="30" />
              </div>

              <div className="w-12 flex items-center relative">
                <TextInput2 form={form} placeholder="15" />
              </div>

              <div className="w-20 flex items-center relative">
                <TextInput2 form={form} placeholder="minutes" />
                <Icons.IconChevronDown className="text-content-secondary" size={20} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b border-surface-outline py-2">
            <div className="w-8">
              <Icons.IconCircle2Filled className="text-accent-1" size={24} />
            </div>

            <div className="flex-1 flex items-center gap-4">
              <div className="w-2/3 flex items-center relative">
                <TextInput2 form={form} placeholder="" />
              </div>

              <div className="w-12 flex items-center relative">
                <TextInput2 form={form} placeholder="" />
              </div>

              <div className="w-12 flex items-center relative">
                <TextInput2 form={form} placeholder="" />
              </div>

              <div className="w-20 flex items-center relative">
                <TextInput2 form={form} placeholder="" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b border-surface-outline py-2">
            <div className="w-8">
              <Icons.IconCircle3Filled className="text-accent-1" size={24} />
            </div>

            <div className="flex-1 flex items-center gap-4">
              <div className="w-2/3 flex items-center relative">
                <TextInput2 form={form} placeholder="" />
              </div>

              <div className="w-12 flex items-center relative">
                <TextInput2 form={form} placeholder="" />
              </div>

              <div className="w-12 flex items-center relative">
                <TextInput2 form={form} placeholder="" />
              </div>

              <div className="w-20 flex items-center relative">
                <TextInput2 form={form} placeholder="" />
              </div>
            </div>
          </div>
        </div>
        <div className="font-bold text-lg mt-8">People</div>
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
      className="border-b border-surface-outline px-0 py-1 w-full"
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}

function TextInput2({ form, autoFocus = false, placeholder }) {
  return <input className="px-0 py-1 w-full" placeholder={placeholder} autoFocus={autoFocus} />;
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

function Targets({ form }) {
  return (
    <div className="flex flex-col gap-6">
      <label className="font-bold mb-1 block">Targets</label>

      <div className="flex flex-col gap-4">
        {form.targetList.targets.map((target, index) => (
          <Target key={index} form={form} target={target} index={index} />
        ))}

        <Button onClick={form.targetList.addTarget} variant="secondary">
          Add Target
        </Button>
      </div>
    </div>
  );
}

function Target({ form, target, index }) {
  return (
    <div className="flex flex-col gap-2">
      <Forms.TextInput
        label="Name"
        value={target.name}
        onChange={target.setName}
        placeholder="e.g. Increase user retention"
        data-test-id={`target-${index}-name-input`}
      />

      <Forms.SelectBox
        label="Unit"
        value={target.unit}
        options={form.targetList.unitOptions}
        onChange={target.setUnit}
        data-test-id={`target-${index}-unit-input`}
      />

      <Button onClick={() => form.targetList.removeTarget(target.id)} variant="secondary">
        Remove Target
      </Button>
    </div>
  );
}
