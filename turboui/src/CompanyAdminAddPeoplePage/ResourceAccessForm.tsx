import * as React from "react";
import { IconPlus, IconX } from "../icons";
import { PrimaryButton, SecondaryButton } from "../Button";
import { Dropdown } from "../forms/Dropdown";
import { CompanyAdminAddPeoplePage } from "./index";

const DEFAULT_PERMISSION_OPTIONS: CompanyAdminAddPeoplePage.PermissionOption[] = [
  { value: "full_access", label: "Full Access" },
  { value: "edit_access", label: "Edit Access" },
  { value: "comment_access", label: "Comment Access" },
  { value: "view_access", label: "View Access" },
];

const RESOURCE_TYPE_OPTIONS: { value: CompanyAdminAddPeoplePage.ResourceType; label: string }[] = [
  { value: "space", label: "Space" },
  { value: "goal", label: "Goal" },
  { value: "project", label: "Project" },
];

function newResourceEntry(): CompanyAdminAddPeoplePage.ResourceAccessEntry {
  return {
    key: Math.random(),
    resourceType: "space",
    resourceId: "",
    resourceName: "",
    accessLevel: "edit_access",
  };
}

interface Props {
  personId: string;
  fullName: string;
  spaces?: CompanyAdminAddPeoplePage.ResourceOption[];
  goals?: CompanyAdminAddPeoplePage.ResourceOption[];
  projects?: CompanyAdminAddPeoplePage.ResourceOption[];
  onGrantAccess?: (input: { personId: string; resources: Array<{ resourceType: CompanyAdminAddPeoplePage.ResourceType; resourceId: string; accessLevel: "full_access" | "edit_access" | "comment_access" | "view_access" | "no_access" }> }) => Promise<any>;
  isGrantingAccess?: boolean;
  permissionOptions?: CompanyAdminAddPeoplePage.PermissionOption[];
}

export function ResourceAccessForm({
  personId,
  fullName,
  spaces,
  goals,
  projects,
  onGrantAccess,
  isGrantingAccess,
  permissionOptions,
}: Props) {
  const [entries, setEntries] = React.useState<CompanyAdminAddPeoplePage.ResourceAccessEntry[]>([newResourceEntry()]);
  const [granted, setGranted] = React.useState(false);
  const options = permissionOptions ?? DEFAULT_PERMISSION_OPTIONS;

  if (!onGrantAccess) return null;
  if (granted) {
    return (
      <div className="mt-6 p-4 bg-surface-dimmed rounded-lg text-sm text-content-accent text-center">
        Access granted successfully.
      </div>
    );
  }

  const addMore = () => setEntries((prev) => [...prev, newResourceEntry()]);

  const updateEntry = (key: number, updates: Partial<CompanyAdminAddPeoplePage.ResourceAccessEntry>) => {
    setEntries((prev) => prev.map((e) => (e.key === key ? { ...e, ...updates } : e)));
  };

  const removeEntry = (key: number) => {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  };

  const handleSubmit = async () => {
    const validEntries = entries.filter((e) => e.resourceId);
    if (validEntries.length === 0) return;

    await onGrantAccess({
      personId,
      resources: validEntries.map((r) => ({
        resourceType: r.resourceType,
        resourceId: r.resourceId,
        accessLevel: r.accessLevel,
      })),
    });
    setGranted(true);
  };

  const hasValidEntries = entries.some((e) => e.resourceId);

  return (
    <div className="mt-6">
      <div className="text-sm font-bold mb-3">Grant {fullName} access to resources</div>

      <div className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <ResourceAccessRow
            key={entry.key}
            entry={entry}
            index={index}
            permissionOptions={options}
            spaces={spaces}
            goals={goals}
            projects={projects}
            onUpdate={updateEntry}
            onRemove={entries.length > 1 ? removeEntry : undefined}
          />
        ))}
      </div>

      <div className="flex justify-center mt-1">
        <SecondaryButton onClick={addMore} testId="add-more-resources">
          <IconPlus size={16} />
        </SecondaryButton>
      </div>

      <div className="flex justify-center mt-4">
        <PrimaryButton onClick={handleSubmit} testId="grant-access-button" loading={isGrantingAccess}>
          {hasValidEntries ? "Grant Access" : "Select resources first"}
        </PrimaryButton>
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
}: ResourceAccessRowProps) {
  const resourceList =
    entry.resourceType === "space" ? spaces : entry.resourceType === "goal" ? goals : projects;

  return (
    <div className="relative border border-surface-outline rounded-lg p-4" data-test-id={`resource-access-${index}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
        <div className="sm:w-1/4">
          <label className="font-bold text-xs mb-1 block">Type</label>
          <TypeSelector
            value={entry.resourceType}
            onChange={(resourceType) => onUpdate(entry.key, { resourceType, resourceId: "", resourceName: "" })}
          />
        </div>

        <div className="sm:flex-1">
          <label className="font-bold text-xs mb-1 block">Resource</label>
          <ResourceSelector
            entry={entry}
            resources={resourceList}
            onSelect={(resource) => onUpdate(entry.key, { resourceId: resource.id, resourceName: resource.name })}
          />
        </div>

        <div className="sm:w-1/4">
          <label className="font-bold text-xs mb-1 block">Access Level</label>
          <AccessLevelSelector
            value={entry.accessLevel}
            options={permissionOptions}
            onChange={(accessLevel) => onUpdate(entry.key, { accessLevel })}
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
}: {
  value: CompanyAdminAddPeoplePage.ResourceType;
  onChange: (type: CompanyAdminAddPeoplePage.ResourceType) => void;
}) {
  const typeItems = RESOURCE_TYPE_OPTIONS.map((opt) => ({ id: opt.value, name: opt.label }));

  return (
    <Dropdown
      items={typeItems}
      value={value}
      onSelect={(item) => onChange(item.id as CompanyAdminAddPeoplePage.ResourceType)}
    />
  );
}

function AccessLevelSelector({
  value,
  options,
  onChange,
}: {
  value: CompanyAdminAddPeoplePage.PermissionOption["value"];
  options: CompanyAdminAddPeoplePage.PermissionOption[];
  onChange: (level: CompanyAdminAddPeoplePage.ResourceAccessEntry["accessLevel"]) => void;
}) {
  const levelItems = options.map((opt) => ({ id: opt.value, name: opt.label }));

  return (
    <Dropdown
      items={levelItems}
      value={value}
      onSelect={(item) => onChange(item.id as CompanyAdminAddPeoplePage.ResourceAccessEntry["accessLevel"])}
    />
  );
}

function ResourceSelector({
  entry,
  resources,
  onSelect,
}: {
  entry: CompanyAdminAddPeoplePage.ResourceAccessEntry;
  resources?: CompanyAdminAddPeoplePage.ResourceOption[];
  onSelect: (resource: CompanyAdminAddPeoplePage.ResourceOption) => void;
}) {
  const resourceItems = (resources || []).map((r) => ({ id: r.id, name: r.name }));

  return (
    <Dropdown
      items={resourceItems}
      value={entry.resourceId}
      onSelect={onSelect}
      placeholder={`Select ${entry.resourceType}...`}
    />
  );
}
