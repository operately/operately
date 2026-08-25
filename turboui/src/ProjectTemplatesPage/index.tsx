import React from "react";
import type { ProjectTemplate } from "../ApiTypes";
import { PrimaryButton, SecondaryButton } from "../Button";
import type { FormattedTimePreferences } from "../FormattedTime";
import * as Forms from "../Forms";
import { DivLink } from "../Link";
import Modal from "../Modal";
import { Menu, MenuActionItem } from "../Menu";
import { Page } from "../Page";
import { Header as ResourceHubHeader } from "../ResourceHub";
import {
  ProjectTemplateLifecycle,
  ProjectTemplateLifecycleAction,
  ProjectTemplateLifecycleDialogs,
} from "../ProjectTemplateLifecycle";
import type { Navigation } from "../Page/Navigation";
import { SpaceField } from "../SpaceField";
import { IconChevronDown, IconSearch, IconX } from "../icons";
import { TemplateCard } from "./TemplateCard";
import { plainDescription } from "./utils";

type ArchiveStatus = "active" | "archived";

export namespace ProjectTemplatesPage {
  export type Space = SpaceField.Space;

  export interface CreateInput {
    name: string;
    spaceId: string;
  }

  export interface MutationResult {
    success: boolean;
    error?: string;
  }

  export interface Props extends ProjectTemplateLifecycle.Handlers {
    scope: "company" | "space";
    navigation: Navigation.Item[];
    templates: ProjectTemplate[];
    spaces: Space[];
    editableSpaces: Space[];
    fixedSpace?: Space;
    templatePath: (templateId: string) => string;
    projectCreationPath?: (template: ProjectTemplate) => string | null;
    spaceTemplatesPath: (spaceId: string) => string;
    onCreate: (input: CreateInput) => Promise<MutationResult>;
    formattedTimePreferences: FormattedTimePreferences;
    canCreate: boolean;
    canEdit: (template: ProjectTemplate) => boolean;
  }
}

export function ProjectTemplatesPage(props: ProjectTemplatesPage.Props) {
  const [templates, setTemplates] = React.useState(props.templates);
  const [search, setSearch] = React.useState("");
  const [selectedSpace, setSelectedSpace] = React.useState<ProjectTemplatesPage.Space | null>(props.fixedSpace ?? null);
  const [archiveStatus, setArchiveStatus] = React.useState<ArchiveStatus>("active");
  const [isCreating, setIsCreating] = React.useState(false);
  const [lifecycle, setLifecycle] = React.useState<{
    template: ProjectTemplate;
    action: ProjectTemplateLifecycleAction;
  } | null>(null);
  React.useEffect(() => setTemplates(props.templates), [props.templates]);

  const filterSpaceSearch = React.useCallback(
    async ({ query }: { query: string }) => filterSpaces(props.spaces, query),
    [props.spaces],
  );
  const createSpaceSearch = React.useCallback(
    async ({ query }: { query: string }) => filterSpaces(props.editableSpaces, query),
    [props.editableSpaces],
  );
  const isFiltered =
    search.trim() !== "" || (props.scope === "company" && selectedSpace !== null) || archiveStatus !== "active";
  const templatesForArchiveStatus = templates.filter((template) => matchesArchiveStatus(template, archiveStatus));
  const visibleTemplates = filterTemplates(templates, search, selectedSpace?.id, archiveStatus);
  const hasTemplates = templates.length > 0;
  const hasArchivedTemplates = templates.some((template) => Boolean(template.archivedAt));
  const hasMultipleTemplates = templatesForArchiveStatus.length > 1;
  const hasMultipleSpaces = new Set(templatesForArchiveStatus.map((template) => template.space.id)).size > 1;
  const showSearch = hasMultipleTemplates || search.trim() !== "";
  const showSpaceFilter = props.scope === "company" && (hasMultipleSpaces || selectedSpace !== null);
  const showArchiveStatus = hasArchivedTemplates || archiveStatus === "archived";
  const showBrowsingControls = showSearch || showSpaceFilter || showArchiveStatus;

  const clearFilters = () => {
    setSearch("");
    setSelectedSpace(props.fixedSpace ?? null);
    setArchiveStatus("active");
  };

  const runOptimisticLifecycle = React.useCallback(
    async (
      handler: (id: string) => Promise<ProjectTemplateLifecycle.MutationResult>,
      id: string,
      update: (templates: ProjectTemplate[]) => ProjectTemplate[],
    ) => {
      const previousTemplates = templates;
      setLifecycle(null);
      setTemplates(update);
      const result = await handler(id);
      if (!result.success) setTemplates(previousTemplates);
      return result;
    },
    [templates],
  );

  return (
    <Page title="Project Templates" size="large" navigation={props.navigation} testId="project-templates-page">
      <main className="min-h-[75vh] px-4 py-10 sm:px-12">
        <ResourceHubHeader
          title="Project Templates"
          actions={
            props.canCreate ? (
              <PrimaryButton onClick={() => setIsCreating(true)} testId="new-project-template">
                New template
              </PrimaryButton>
            ) : undefined
          }
        />

        {hasTemplates && showBrowsingControls && (
          <div
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            data-test-id="project-template-toolbar"
          >
            {(showSearch || showSpaceFilter) && (
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                {showSearch && (
                  <div className="relative w-full sm:max-w-sm">
                    <IconSearch
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-content-dimmed"
                    />
                    <Forms.Input
                      type="text"
                      name="project-template-search"
                      role="searchbox"
                      aria-label="Search project templates"
                      placeholder="Search project templates…"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="py-2 pl-9 pr-9 text-base sm:text-sm"
                      testId="project-template-search"
                    />
                    {search && (
                      <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-content-dimmed hover:text-content-accent"
                      >
                        <IconX size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
                {showSpaceFilter && (
                  <SpaceField
                    space={selectedSpace}
                    setSpace={setSelectedSpace}
                    search={filterSpaceSearch}
                    emptyStateMessage="All Spaces"
                    testId="project-template-space-filter"
                  />
                )}
              </div>
            )}
            {showArchiveStatus && (
              <div className="sm:ml-auto">
                <ArchiveStatusMenu value={archiveStatus} onChange={setArchiveStatus} />
              </div>
            )}
          </div>
        )}

        {hasTemplates ? (
          <TemplatesContent
            {...props}
            templates={visibleTemplates}
            archiveStatus={archiveStatus}
            hasArchivedTemplates={hasArchivedTemplates}
            isFiltered={isFiltered}
            onClearFilters={clearFilters}
            onViewArchived={() => setArchiveStatus("archived")}
            onLifecycleAction={(template, action) => setLifecycle({ template, action })}
          />
        ) : (
          <EmptyTemplateLibrary canCreate={props.canCreate} scope={props.scope} />
        )}
      </main>

      <CreateTemplateModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        fixedSpace={props.fixedSpace}
        editableSpaces={props.editableSpaces}
        spaceSearch={createSpaceSearch}
        onCreate={props.onCreate}
      />
      <ProjectTemplateLifecycleDialogs
        action={lifecycle?.action ?? null}
        template={lifecycle?.template ?? null}
        onClose={() => setLifecycle(null)}
        onDuplicate={props.onDuplicate}
        onArchive={(id) =>
          runOptimisticLifecycle(props.onArchive, id, (items) =>
            items.map((template) =>
              template.id === id ? { ...template, archivedAt: new Date().toISOString() } : template,
            ),
          )
        }
        onRestore={(id) =>
          runOptimisticLifecycle(props.onRestore, id, (items) =>
            items.map((template) => (template.id === id ? { ...template, archivedAt: null } : template)),
          )
        }
        onDelete={(id) =>
          runOptimisticLifecycle(props.onDelete, id, (items) => items.filter((template) => template.id !== id))
        }
      />
    </Page>
  );
}

function TemplatesContent(
  props: ProjectTemplatesPage.Props & {
    templates: ProjectTemplate[];
    archiveStatus: ArchiveStatus;
    hasArchivedTemplates: boolean;
    isFiltered: boolean;
    onClearFilters: () => void;
    onViewArchived: () => void;
    onLifecycleAction: (template: ProjectTemplate, action: ProjectTemplateLifecycleAction) => void;
  },
) {
  if (
    props.templates.length === 0 &&
    props.archiveStatus === "active" &&
    props.hasArchivedTemplates &&
    !props.isFiltered
  ) {
    return (
      <TemplateListMessage actionLabel="View archived" onAction={props.onViewArchived}>
        No active templates.
      </TemplateListMessage>
    );
  }

  if (props.templates.length === 0 && props.isFiltered)
    return (
      <TemplateListMessage actionLabel="Clear filters" onAction={props.onClearFilters}>
        No matching templates.
      </TemplateListMessage>
    );

  if (props.scope === "space") {
    return <TemplateGrid {...props} />;
  }

  return (
    <div className="mt-8 space-y-10">
      {groupBySpace(props.templates).map(({ space, templates }) => (
        <section key={space.id}>
          <DivLink
            to={props.spaceTemplatesPath(space.id)}
            className="mb-3 inline-block font-semibold hover:text-content-accent"
          >
            {space.name}
          </DivLink>
          <TemplateGrid {...props} templates={templates} />
        </section>
      ))}
    </div>
  );
}

function TemplateGrid(
  props: ProjectTemplatesPage.Props & {
    templates: ProjectTemplate[];
    onLifecycleAction: (template: ProjectTemplate, action: ProjectTemplateLifecycleAction) => void;
  },
) {
  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-2" data-test-id="project-template-grid">
      {props.templates.map((template) => (
        <TemplateCard key={template.id} template={template} {...props} />
      ))}
    </div>
  );
}

function ArchiveStatusMenu({ value, onChange }: { value: ArchiveStatus; onChange: (value: ArchiveStatus) => void }) {
  const label = value === "active" ? "Active" : "Archived";

  return (
    <Menu
      testId="project-template-status-filter"
      align="start"
      size="tiny"
      customTrigger={
        <button
          type="button"
          className="inline-flex w-full items-center justify-between gap-2 rounded-md border border-surface-outline bg-surface-base px-3 py-1.5 text-sm text-content-dimmed hover:bg-surface-accent hover:text-content-base sm:w-auto sm:justify-start"
        >
          {label} <IconChevronDown size={16} />
        </button>
      }
    >
      <MenuActionItem onClick={() => onChange("active")}>Active</MenuActionItem>
      <MenuActionItem onClick={() => onChange("archived")}>Archived</MenuActionItem>
    </Menu>
  );
}

function filterTemplates(
  templates: ProjectTemplate[],
  search: string,
  spaceId: string | undefined,
  archiveStatus: ArchiveStatus,
) {
  const normalizedSearch = search.trim().toLowerCase();

  return templates.filter((template) => {
    const searchableText = `${template.name} ${plainDescription(template.description)}`.toLowerCase();
    const matchesSearch = normalizedSearch === "" || searchableText.includes(normalizedSearch);
    const matchesSpace = !spaceId || template.space.id === spaceId;
    const matchesStatus = matchesArchiveStatus(template, archiveStatus);

    return matchesSearch && matchesSpace && matchesStatus;
  });
}

function matchesArchiveStatus(template: ProjectTemplate, archiveStatus: ArchiveStatus) {
  return archiveStatus === "archived" ? Boolean(template.archivedAt) : !template.archivedAt;
}

function CreateTemplateModal({
  isOpen,
  onClose,
  fixedSpace,
  editableSpaces,
  spaceSearch,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  fixedSpace?: ProjectTemplatesPage.Space;
  editableSpaces: ProjectTemplatesPage.Space[];
  spaceSearch: SpaceField.SearchSpaceFn;
  onCreate: ProjectTemplatesPage.Props["onCreate"];
}) {
  const [space, setSpace] = React.useState<ProjectTemplatesPage.Space | null>(fixedSpace ?? null);
  const form = Forms.useForm({
    fields: { name: "" },
    validate: (addError) => {
      if (!fixedSpace && !space) addError("space", "Select a Space");
    },
    submit: async () => {
      const selectedSpace = fixedSpace ?? space;
      if (!selectedSpace) return;
      const result = await onCreate({ name: form.values.name.trim(), spaceId: selectedSpace.id });
      if (!result.success) throw new Error(result.error ?? "The template could not be created. Try again.");
      form.actions.reset();
      setSpace(fixedSpace ?? null);
      onClose();
    },
    cancel: async () => {
      setSpace(fixedSpace ?? null);
      onClose();
    },
    onError: (error) =>
      form.actions.addErrors({
        form: error instanceof Error ? error.message : "The template could not be created. Try again.",
      }),
  });

  React.useEffect(() => {
    if (isOpen) setSpace(fixedSpace ?? (editableSpaces.length === 1 ? (editableSpaces[0] ?? null) : null));
  }, [editableSpaces, fixedSpace, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={() => void form.actions.cancel()} title="New project template" size="medium">
      <Forms.Form form={form} className="space-y-5" testId="new-project-template-form">
        <Forms.TextInput field="name" label="Template name" placeholder="e.g. Product launch" required autoFocus />
        {!fixedSpace && (
          <SpaceField
            space={space}
            setSpace={setSpace}
            search={spaceSearch}
            variant="form-field"
            label="Space"
            error={form.errors.space}
            testId="new-project-template-space"
          />
        )}
        <Forms.FormError message={form.errors.form} />
        <div className="flex justify-end gap-3">
          <SecondaryButton type="button" onClick={() => void form.actions.cancel()} disabled={form.state !== "idle"}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" loading={form.state === "submitting"} testId="create-project-template">
            Create template
          </PrimaryButton>
        </div>
      </Forms.Form>
    </Modal>
  );
}

function EmptyTemplateLibrary({
  canCreate,
  scope,
}: {
  canCreate: boolean;
  scope: ProjectTemplatesPage.Props["scope"];
}) {
  const readOnlyMessage =
    scope === "space"
      ? "No project templates have been created in this space yet."
      : "No project templates have been created in this company yet.";

  return (
    <section
      className="flex flex-col items-center gap-4 px-4 py-20 text-center sm:py-24"
      data-test-id="empty-template-library"
    >
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-balance font-semibold text-content-accent">
          {canCreate ? "Create your first project template" : "No project templates yet"}
        </h2>
        <p className="max-w-sm text-pretty text-base text-content-dimmed sm:text-sm">
          {canCreate ? "Build a reusable starting point for recurring work." : readOnlyMessage}
        </p>
      </div>
    </section>
  );
}

function TemplateListMessage({
  children,
  actionLabel,
  onAction,
}: {
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="text-pretty text-base text-content-dimmed sm:text-sm">{children}</p>
      <SecondaryButton size="xs" onClick={onAction}>
        {actionLabel}
      </SecondaryButton>
    </div>
  );
}

function groupBySpace(templates: ProjectTemplate[]) {
  const groups = new Map<string, { space: ProjectTemplate["space"]; templates: ProjectTemplate[] }>();
  templates.forEach((template) => {
    const group = groups.get(template.space.id) ?? { space: template.space, templates: [] };
    group.templates.push(template);
    groups.set(template.space.id, group);
  });
  return Array.from(groups.values());
}

function filterSpaces(spaces: ProjectTemplatesPage.Space[], query: string) {
  const normalized = query.trim().toLowerCase();
  return spaces.filter((space) => space.name.toLowerCase().includes(normalized));
}
