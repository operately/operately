import React from "react";
import type { ProjectTemplate } from "../ApiTypes";
import { PrimaryButton, SecondaryButton } from "../Button";
import type { FormattedTimePreferences } from "../FormattedTime";
import * as Forms from "../Forms";
import { DivLink } from "../Link";
import Modal from "../Modal";
import { Menu, MenuActionItem } from "../Menu";
import { Page } from "../Page";
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
  const visibleTemplates = filterTemplates(templates, search, selectedSpace?.id, archiveStatus);

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
    <Page title="Project Templates" size="xxlarge" navigation={props.navigation} testId="project-templates-page">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Project Templates</h1>
            <p className="mt-1 text-sm text-content-dimmed">Reuse a proven project structure for recurring work.</p>
          </div>
          {props.canCreate && (
            <PrimaryButton onClick={() => setIsCreating(true)} testId="new-project-template">
              New template
            </PrimaryButton>
          )}
        </header>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <IconSearch
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-content-dimmed"
            />
            <Forms.Input
              type="text"
              role="searchbox"
              aria-label="Search project templates"
              placeholder="Search project templates…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="py-2 pl-9 pr-9 text-sm"
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
          {props.scope === "company" && (
            <SpaceField
              space={selectedSpace}
              setSpace={setSelectedSpace}
              search={filterSpaceSearch}
              emptyStateMessage="All Spaces"
              testId="project-template-space-filter"
            />
          )}
          <ArchiveStatusMenu value={archiveStatus} onChange={setArchiveStatus} />
        </div>

        <TemplatesContent
          {...props}
          templates={visibleTemplates}
          isFiltered={isFiltered}
          onLifecycleAction={(template, action) => setLifecycle({ template, action })}
        />
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
    isFiltered: boolean;
    onLifecycleAction: (template: ProjectTemplate, action: ProjectTemplateLifecycleAction) => void;
  },
) {
  if (props.templates.length === 0 && props.isFiltered)
    return <PageMessage>No matching templates. Try a different search or Space.</PageMessage>;
  if (props.templates.length === 0) return <PageMessage>No project templates yet.</PageMessage>;

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
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          className="inline-flex items-center gap-2 rounded-md border border-surface-outline bg-surface-base px-3 py-1.5 text-sm text-content-dimmed transition hover:bg-surface-accent hover:text-content-base"
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
    const matchesArchiveStatus = archiveStatus === "archived" ? Boolean(template.archivedAt) : !template.archivedAt;

    return matchesSearch && matchesSpace && matchesArchiveStatus;
  });
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

function PageMessage({ children, role = "status" }: { children: React.ReactNode; role?: "status" | "alert" }) {
  return (
    <div
      role={role}
      className="mt-12 rounded-lg border border-surface-outline px-6 py-12 text-center text-sm text-content-dimmed"
    >
      {children}
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
