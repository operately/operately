import React from "react";
import type { ProjectTemplate } from "../ApiTypes";
import { Avatar } from "../Avatar";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import { DivLink } from "../Link";
import { Menu, MenuActionItem, MenuSeparator } from "../Menu";
import type { ProjectTemplateLifecycleAction } from "../ProjectTemplateLifecycle";
import { IconArchive, IconArrowRight, IconCopy, IconRotate, IconTrash } from "../icons";
import { plainDescription } from "./utils";

export interface TemplateCardProps {
  template: ProjectTemplate;
  templatePath: (templateId: string) => string;
  projectCreationPath?: (template: ProjectTemplate) => string | null;
  formattedTimePreferences: FormattedTimePreferences;
  canEdit: (template: ProjectTemplate) => boolean;
  onLifecycleAction: (template: ProjectTemplate, action: ProjectTemplateLifecycleAction) => void;
}

export function TemplateCard({
  template,
  templatePath,
  projectCreationPath,
  formattedTimePreferences,
  canEdit,
  onLifecycleAction,
}: TemplateCardProps) {
  const description = plainDescription(template.description);
  const archived = Boolean(template.archivedAt);
  const createProjectPath = archived ? null : projectCreationPath?.(template);

  return (
    <article className="relative flex min-h-52 flex-col rounded-xl border border-surface-outline bg-surface-base shadow-sm">
      {canEdit(template) && (
        <div className="absolute right-3 top-3 z-10">
          <Menu testId={`project-template-actions-${template.id}`} align="end" size="tiny">
            <MenuActionItem icon={IconCopy} hidden={archived} onClick={() => onLifecycleAction(template, "duplicate")}>
              Duplicate
            </MenuActionItem>
            <MenuActionItem icon={IconArchive} hidden={archived} onClick={() => onLifecycleAction(template, "archive")}>
              Archive
            </MenuActionItem>
            <MenuActionItem icon={IconRotate} hidden={!archived} onClick={() => onLifecycleAction(template, "restore")}>
              Restore
            </MenuActionItem>
            <MenuSeparator />
            <MenuActionItem icon={IconTrash} danger onClick={() => onLifecycleAction(template, "delete")}>
              Delete
            </MenuActionItem>
          </Menu>
        </div>
      )}
      <DivLink
        to={templatePath(template.id)}
        className="flex flex-1 flex-col rounded-t-xl p-5 pr-12 transition hover:bg-surface-highlight"
        testId={`project-template-${template.id}`}
      >
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span>{template.name}</span>
          {archived && (
            <span className="rounded-full bg-surface-dimmed px-2 py-0.5 text-xs font-medium text-content-dimmed">
              Archived
            </span>
          )}
        </div>
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
