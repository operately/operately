import React from "react";

import * as Projects from "@/models/projects";
import * as Icons from "@tabler/icons-react";

import Button from "@/components/Button";
import PeopleSearch from "@/components/PeopleSearch";
import { SelectBox } from "@/components/Form";
import { PERMISSIONS_LIST } from "@/features/Permissions";

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
      <Button variant="danger" onClick={onClick} loading={loading} data-test-id="remove-contributor">
        Remove
      </Button>
    </div>
  );
}

export function CancelButton({ onClick }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      Cancel
    </Button>
  );
}

export function SaveButton({ disabled, onClick }) {
  return (
    <Button variant="success" disabled={disabled} onClick={onClick}>
      Save
    </Button>
  );
}

export function AddContribButton({ disabled, onClick, loading }) {
  return (
    <Button loading={loading} variant="success" disabled={disabled} onClick={onClick} data-test-id="save-contributor">
      <Icons.IconPlus size={20} />
      Add Contributor
    </Button>
  );
}
