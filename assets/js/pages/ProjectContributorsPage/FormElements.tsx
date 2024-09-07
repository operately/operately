import * as React from "react";
import * as Projects from "@/models/projects";

import { GhostButton, PrimaryButton } from "@/components/Buttons";
import { SelectBox } from "@/components/Form";
import { PERMISSIONS_LIST } from "@/features/Permissions";

import PeopleSearch from "@/components/PeopleSearch";

export function ContributorSearch({ projectID, title, onSelect, defaultValue = undefined }) {
  const loader = Projects.useProjectContributorCandidates(projectID);

  return (
    <div className="mb-6">
      <label className="font-bold mb-1 block capitalize">{title}</label>
      <div className="flex-1">
        <PeopleSearch
          onChange={(option) => onSelect(option?.value)}
          placeholder="Search by name or title..."
          loader={loader}
          defaultValue={defaultValue}
        />
      </div>
    </div>
  );
}

export function ResponsibilityInput({ value, onChange }) {
  return (
    <div className="mb-6">
      <label className="font-bold mb-1 block">What are the responsibilities of this contributor?</label>
      <div className="flex-1">
        <input
          data-test-id="contributor-responsibility-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface text-content-accent placeholder-content-dimmed border border-surface-outline rounded-lg px-3"
          type="text"
          placeholder="e.g. Responsible for the visual design of the project."
        />
      </div>
    </div>
  );
}

export function PermissionsInput({ value, onChange }) {
  return (
    <SelectBox
      label="What are the permissions of this contributor"
      onChange={onChange}
      options={PERMISSIONS_LIST}
      value={value}
    />
  );
}

export function RemoveButton({ onClick, loading }) {
  return (
    <div className="flex gap-2">
      <GhostButton type="secondary" onClick={onClick} loading={loading} testId="remove-contributor">
        Remove
      </GhostButton>
    </div>
  );
}

export function CancelButton({ onClick }) {
  return <GhostButton onClick={onClick}>Cancel</GhostButton>;
}

export function SaveButton({ onClick }) {
  return <PrimaryButton onClick={onClick}>Save</PrimaryButton>;
}

export function AddContribButton({ onClick, loading }) {
  return (
    <PrimaryButton loading={loading} onClick={onClick} testId="save-contributor">
      Add Contributor
    </PrimaryButton>
  );
}
