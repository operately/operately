import React from "react";
import { CompanyAdminAddPeoplePage } from "..";
import { IconPlus, IconX } from "../../icons";
import { Dropdown } from "../../forms/Dropdown";
import { SecondaryButton } from "../../Button";

const RESOURCE_TYPE_OPTIONS: { value: CompanyAdminAddPeoplePage.ResourceType; label: string }[] = [
  { value: "space", label: "Space" },
  { value: "goal", label: "Goal" },
  { value: "project", label: "Project" },
];

export interface ResourceAccessContentProps {
  fullName: string;
  entries: CompanyAdminAddPeoplePage.ResourceAccessEntry[];
  errors: Record<number, string>;
  onAddEntry: () => void;
  onUpdateEntry: (key: number, updates: Partial<CompanyAdminAddPeoplePage.ResourceAccessEntry>) => void;
  onRemoveEntry: (key: number) => void;
  spaces?: CompanyAdminAddPeoplePage.ResourceOption[];
  goals?: CompanyAdminAddPeoplePage.ResourceOption[];
  projects?: CompanyAdminAddPeoplePage.ResourceOption[];
  permissionOptions: CompanyAdminAddPeoplePage.PermissionOption[];
  accessGranted: boolean;
}

export function ResourceAccessContent({
  fullName,
  entries,
  errors,
  onAddEntry,
  onUpdateEntry,
  onRemoveEntry,
  spaces,
  goals,
  projects,
  permissionOptions,
  accessGranted,
}: ResourceAccessContentProps) {
  if (accessGranted) {
    return (
      <div className="mt-6 p-4 bg-surface-dimmed rounded-lg text-sm text-content-accent text-center">
        Access granted successfully.
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="border-t border-surface-outline mb-12" />
      <div className="text-sm font-bold mb-3">
        Choose what spaces, goals and projects {fullName} should have access to:
      </div>

      <div className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <ResourceAccessRow
            key={entry.key}
            entry={entry}
            index={index}
            permissionOptions={permissionOptions}
            spaces={spaces}
            goals={goals}
            projects={projects}
            onUpdate={onUpdateEntry}
            onRemove={entries.length > 1 ? onRemoveEntry : undefined}
            error={errors[entry.key]}
          />
        ))}
      </div>

      <div className="flex justify-center mt-1">
        <SecondaryButton onClick={onAddEntry} testId="add-more-resources">
          <IconPlus size={16} />
        </SecondaryButton>
      </div>
    </div>
  );
}

interface ResourceAccessRowProps {
  entry: CompanyAdminAddPeoplePage.ResourceAccessEntry;
  index: number;
  permissionOptions: CompanyAdminAddPeoplePage.PermissionOption[];
  spaces?: CompanyAdminAddPeoplePage.ResourceOption[];
  goals?: CompanyAdminAddPeoplePage.ResourceOption[];
  projects?: CompanyAdminAddPeoplePage.ResourceOption[];
  onUpdate: (key: number, updates: Partial<CompanyAdminAddPeoplePage.ResourceAccessEntry>) => void;
  onRemove?: (key: number) => void;
  error?: string;
}

function ResourceAccessRow({
  entry,
  index,
  permissionOptions,
  spaces,
  goals,
  projects,
  onUpdate,
  onRemove,
  error,
}: ResourceAccessRowProps) {
  const resourceList = entry.resourceType === "space" ? spaces : entry.resourceType === "goal" ? goals : projects;

  return (
    <div className="relative border border-surface-outline rounded-lg p-4" data-test-id={`resource-access-${index}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        <div className="sm:w-1/4">
          <label className="font-bold text-xs mb-1 block">Type</label>
          <TypeSelector
            value={entry.resourceType}
            onChange={(resourceType) => onUpdate(entry.key, { resourceType, resourceId: "", resourceName: "" })}
            testId={`resource-type-selector-${index}`}
          />
        </div>

        <div className="sm:flex-1">
          <label className="font-bold text-xs mb-1 block">Resource</label>
          <ResourceSelector
            entry={entry}
            resources={resourceList}
            onSelect={(resource) => onUpdate(entry.key, { resourceId: resource.id, resourceName: resource.name })}
            error={error}
            testId={`resource-selector-${index}`}
          />
        </div>

        <div className="sm:w-1/4">
          <label className="font-bold text-xs mb-1 block">Access Level</label>
          <AccessLevelSelector
            value={entry.accessLevel}
            options={permissionOptions}
            onChange={(accessLevel) => onUpdate(entry.key, { accessLevel })}
            testId={`access-level-selector-${index}`}
          />
        </div>
      </div>

      {onRemove && (
        <button
          className="absolute border border-surface-outline rounded-full p-1.5 cursor-pointer text-content-subtle hover:text-content-accent bg-surface-base"
          style={{ top: "-10px", right: "-10px" }}
          onClick={() => onRemove(entry.key)}
          type="button"
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}

function TypeSelector({
  value,
  onChange,
  testId,
}: {
  value: CompanyAdminAddPeoplePage.ResourceType;
  onChange: (type: CompanyAdminAddPeoplePage.ResourceType) => void;
  testId?: string;
}) {
  const typeItems = RESOURCE_TYPE_OPTIONS.map((opt) => ({ id: opt.value, name: opt.label }));

  return (
    <Dropdown
      items={typeItems}
      value={value}
      onSelect={(item) => onChange(item.id as CompanyAdminAddPeoplePage.ResourceType)}
      testId={testId}
    />
  );
}

function AccessLevelSelector({
  value,
  options,
  onChange,
  testId,
}: {
  value: CompanyAdminAddPeoplePage.PermissionOption["value"];
  options: CompanyAdminAddPeoplePage.PermissionOption[];
  onChange: (level: CompanyAdminAddPeoplePage.ResourceAccessEntry["accessLevel"]) => void;
  testId?: string;
}) {
  const levelItems = options.map((opt) => ({ id: opt.value, name: opt.label }));

  return (
    <Dropdown
      items={levelItems}
      value={value}
      onSelect={(item) => onChange(item.id as CompanyAdminAddPeoplePage.ResourceAccessEntry["accessLevel"])}
      testId={testId}
    />
  );
}

function ResourceSelector({
  entry,
  resources,
  onSelect,
  error,
  testId,
}: {
  entry: CompanyAdminAddPeoplePage.ResourceAccessEntry;
  resources?: CompanyAdminAddPeoplePage.ResourceOption[];
  onSelect: (resource: CompanyAdminAddPeoplePage.ResourceOption) => void;
  error?: string;
  testId?: string;
}) {
  const resourceItems = (resources || []).map((r) => ({ id: r.id, name: r.name }));

  return (
    <Dropdown
      items={resourceItems}
      value={entry.resourceId}
      onSelect={onSelect}
      placeholder={`Select ${entry.resourceType}...`}
      error={error}
      testId={testId}
    />
  );
}
