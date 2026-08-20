import React from "react";
import { ActionList } from "../ActionList";
import { MilestoneList } from "../MilestoneList";
import { PageDescription } from "../PageDescription";
import { RelativeDayField } from "../RelativeDayField";
import { SidebarSection } from "../SidebarSection";
import { IconArchive, IconCopy, IconRotate, IconTrash } from "../icons";
import type { ProjectTemplateLifecycleAction } from "../ProjectTemplateLifecycle";
import type { TemplateProjectPage } from ".";
import { TemplatePeople } from "./People";

interface OverviewProps {
  props: TemplateProjectPage.Props;
  canEdit: boolean;
  onLifecycleAction: (action: ProjectTemplateLifecycleAction) => void;
}

export function Overview({ props, canEdit, onLifecycleAction }: OverviewProps) {
  return (
    <div className="mx-auto my-6 max-w-6xl p-4">
      <div className="grid gap-8 md:grid-cols-12">
        <div className="space-y-8 md:col-span-8">
          <section data-test-id="description-section">
            <PageDescription
              description={props.template.description}
              onDescriptionChange={async (description) => (await props.onTemplateUpdate({ description })) !== false}
              richTextHandlers={props.richTextHandlers}
              canEdit={canEdit}
              label="Description"
              placeholder="Add a template description..."
              zeroStatePlaceholder="Add a template description..."
            />
          </section>
          <div className="border-t border-surface-outline pt-8">
            <MilestoneList
              variant="project-template"
              milestones={props.milestones}
              canEdit={canEdit}
              onMilestoneCreate={props.onMilestoneCreate}
              onMilestoneUpdate={props.onMilestoneUpdate}
              onMilestoneReorder={props.onMilestoneReorder}
            />
          </div>
        </div>
        <aside className="space-y-6 md:col-span-4 md:pl-8">
          <section>
            <h2 className="mb-1 text-sm font-bold">Project duration</h2>
            <RelativeDayField
              value={props.template.durationDays}
              onChange={async (durationDays) => {
                await props.onTemplateUpdate({ durationDays });
              }}
              readonly={!canEdit}
              placeholder="Set project duration"
              testId="template-duration"
            />
          </section>
          <TemplatePeople props={props} canEdit={canEdit} />
          <TemplateActions props={props} onAction={onLifecycleAction} />
        </aside>
      </div>
    </div>
  );
}

function TemplateActions({
  props,
  onAction,
}: {
  props: TemplateProjectPage.Props;
  onAction: (action: ProjectTemplateLifecycleAction) => void;
}) {
  if (!props.permissions.canEdit) return null;

  const deleteAction = {
    type: "action" as const,
    icon: IconTrash,
    label: "Delete",
    testId: "delete-project-template",
    onClick: () => onAction("delete"),
    danger: true,
  };

  const actions = props.template.archived
    ? [
        {
          type: "action" as const,
          icon: IconRotate,
          label: "Restore",
          testId: "restore-project-template",
          onClick: () => onAction("restore"),
        },
        deleteAction,
      ]
    : [
        {
          type: "action" as const,
          icon: IconCopy,
          label: "Duplicate",
          testId: "duplicate-project-template-action",
          onClick: () => onAction("duplicate"),
        },
        {
          type: "action" as const,
          icon: IconArchive,
          label: "Archive",
          testId: "archive-project-template",
          onClick: () => onAction("archive"),
        },
        deleteAction,
      ];

  return (
    <div className="pt-6 mt-6 border-t border-surface-outline">
      <SidebarSection title="Actions" testId="actions-section">
        <ActionList actions={actions} />
      </SidebarSection>
    </div>
  );
}
