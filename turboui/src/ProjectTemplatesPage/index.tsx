import React from "react";
import type { ProjectTemplate } from "../ApiTypes";
import { Avatar } from "../Avatar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import * as Forms from "../Forms";
import { DivLink } from "../Link";
import Modal from "../Modal";
import { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import { richContentToString, parseContent } from "../RichContent";
import { SpaceField } from "../SpaceField";
import { IconArrowRight, IconSearch, IconX } from "../icons";

type SearchStatus = "idle" | "loading" | "error";

export namespace ProjectTemplatesPage {
  export type Space = SpaceField.Space;

  export interface Filters {
    search: string;
    spaceId: string | null;
  }

  export interface CreateInput {
    name: string;
    spaceId: string;
  }

  export interface MutationResult {
    success: boolean;
    error?: string;
  }

  export interface Props {
    scope: "company" | "space";
    navigation: Navigation.Item[];
    templates: ProjectTemplate[];
    spaces: Space[];
    editableSpaces: Space[];
    fixedSpace?: Space;
    templatePath: (templateId: string) => string;
    projectCreationPath?: (template: ProjectTemplate) => string | null;
    spaceTemplatesPath: (spaceId: string) => string;
    onFilter: (filters: Filters) => Promise<ProjectTemplate[]>;
    onCreate: (input: CreateInput) => Promise<MutationResult>;
    formattedTimePreferences: FormattedTimePreferences;
    canCreate: boolean;
  }
}

export function ProjectTemplatesPage(props: ProjectTemplatesPage.Props) {
  const [templates, setTemplates] = React.useState(props.templates);
  const [search, setSearch] = React.useState("");
  const [selectedSpace, setSelectedSpace] = React.useState<ProjectTemplatesPage.Space | null>(props.fixedSpace ?? null);
  const [status, setStatus] = React.useState<SearchStatus>("idle");
  const [isCreating, setIsCreating] = React.useState(false);
  const requestSequence = React.useRef(0);
  const onFilterRef = React.useRef(props.onFilter);
  const previousSearch = React.useRef(search);
  const previousSpaceId = React.useRef(selectedSpace?.id);

  onFilterRef.current = props.onFilter;

  React.useEffect(() => setTemplates(props.templates), [props.templates]);

  React.useEffect(() => {
    const spaceId = selectedSpace?.id;
    if (previousSearch.current === search && previousSpaceId.current === spaceId) return;

    previousSearch.current = search;
    previousSpaceId.current = spaceId;

    const requestId = ++requestSequence.current;
    const timeout = window.setTimeout(
      async () => {
        setStatus("loading");
        try {
          const nextTemplates = await onFilterRef.current({ search: search.trim(), spaceId: spaceId ?? null });
          if (requestSequence.current !== requestId) return;
          setTemplates(nextTemplates);
          setStatus("idle");
        } catch (_error) {
          if (requestSequence.current !== requestId) return;
          setStatus("error");
        }
      },
      search.trim() ? 300 : 0,
    );

    return () => window.clearTimeout(timeout);
  }, [search, selectedSpace?.id]);

  const filterSpaceSearch = React.useCallback(
    async ({ query }: { query: string }) => filterSpaces(props.spaces, query),
    [props.spaces],
  );
  const createSpaceSearch = React.useCallback(
    async ({ query }: { query: string }) => filterSpaces(props.editableSpaces, query),
    [props.editableSpaces],
  );
  const isFiltered = search.trim() !== "" || (props.scope === "company" && selectedSpace !== null);

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
        </div>

        <TemplatesContent {...props} templates={templates} status={status} isFiltered={isFiltered} />
      </main>

      <CreateTemplateModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        fixedSpace={props.fixedSpace}
        editableSpaces={props.editableSpaces}
        spaceSearch={createSpaceSearch}
        onCreate={props.onCreate}
      />
    </Page>
  );
}

function TemplatesContent(
  props: ProjectTemplatesPage.Props & {
    templates: ProjectTemplate[];
    status: SearchStatus;
    isFiltered: boolean;
  },
) {
  if (props.status === "loading") return <PageMessage>Loading templates…</PageMessage>;
  if (props.status === "error")
    return <PageMessage role="alert">Templates could not be loaded. Try again.</PageMessage>;
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

function TemplateGrid(props: ProjectTemplatesPage.Props & { templates: ProjectTemplate[] }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {props.templates.map((template) => (
        <TemplateCard key={template.id} template={template} {...props} />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  templatePath,
  projectCreationPath,
  formattedTimePreferences,
}: Pick<ProjectTemplatesPage.Props, "templatePath" | "projectCreationPath" | "formattedTimePreferences"> & {
  template: ProjectTemplate;
}) {
  const description = plainDescription(template.description);
  const createProjectPath = projectCreationPath?.(template);

  return (
    <article className="flex min-h-52 flex-col rounded-xl border border-surface-outline bg-surface-base shadow-sm">
      <DivLink
        to={templatePath(template.id)}
        className="flex flex-1 flex-col rounded-t-xl p-5 transition hover:bg-surface-highlight"
        testId={`project-template-${template.id}`}
      >
        <div className="text-lg font-semibold">{template.name}</div>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-content-dimmed">{description || "No description"}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-surface-outline pt-3 text-xs text-content-dimmed">
          <div className="flex min-w-0 items-center gap-2">
            {template.creator ? <Avatar person={template.creator} size={20} /> : null}
            <span className="truncate">{template.creator?.fullName ?? "Creator unavailable"}</span>
          </div>
          <span className="shrink-0">
            Updated{" "}
            <FormattedTime {...formattedTimePreferences} time={template.updatedAt} format="relative-time-or-date" />
          </span>
        </div>
      </DivLink>
      {createProjectPath ? (
        <DivLink
          to={createProjectPath}
          className="group flex w-full items-center justify-between rounded-b-xl border-t border-surface-outline px-5 py-3 text-sm font-semibold text-content-accent transition-colors hover:bg-surface-highlight focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-base"
          testId={`create-project-from-template-${template.id}`}
        >
          <span>Create project</span>
          <IconArrowRight
            size={16}
            aria-hidden="true"
            className="text-content-dimmed transition-transform group-hover:translate-x-0.5"
          />
        </DivLink>
      ) : null}
    </article>
  );
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

function plainDescription(description?: string | null) {
  if (!description) return "";
  try {
    return richContentToString(parseContent(description)).trim();
  } catch (_error) {
    return "";
  }
}
