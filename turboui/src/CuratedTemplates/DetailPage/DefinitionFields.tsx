import React from "react";
import { useTranslation } from "react-i18next";
import * as Forms from "../../Forms";
import { SecondaryButton } from "../../Button";
import { moveItem, removeMilestone } from "./definition";
import type { TemplateDefinition, TemplateType } from "../types";

const richTextHandlers = { mentionedPersonLookup: async () => null, resolveResourceLinks: null };

export function DefinitionFields({ type, definition }: { type: TemplateType; definition: TemplateDefinition }) {
  const { t } = useTranslation();
  const form = Forms.useFormContext();
  function append(field: "targets" | "milestones" | "tasks") {
    const key = crypto.randomUUID();
    const item = field === "targets" ? { editorKey: key } : { key };
    form.actions.setValue(`definition.${field}`, [...(definition[field] ?? []), item]);
  }
  function reorder(field: "targets" | "milestones" | "tasks", index: number, delta: number) {
    form.actions.setValue(`definition.${field}`, moveItem<unknown>(definition[field] ?? [], index, delta));
    form.actions.clearErrors();
  }
  function remove(field: "targets" | "milestones" | "tasks", index: number) {
    const milestone = definition.milestones?.[index];
    if (field === "milestones" && milestone)
      form.actions.setValue("definition", removeMilestone(definition, milestone.key));
    else
      form.actions.setValue(
        `definition.${field}`,
        (definition[field] ?? []).filter((_, i) => i !== index),
      );
    form.actions.clearErrors();
  }

  return (
    <>
      <Forms.RichTextArea field="definition.description" label={t("Description")} richTextHandlers={richTextHandlers} />
      {type === "kpi" ? (
        <>
          <Forms.TextInput field="definition.unit" label={t("Unit")} />
          <Forms.SelectBox
            field="definition.cadence"
            label={t("Cadence")}
            options={[
              { value: "weekly", label: t("Weekly") },
              { value: "monthly", label: t("Monthly") },
            ]}
          />
        </>
      ) : (
        <Forms.NumberInput field="definition.duration_days" label={t("Duration in days")} />
      )}
      {type === "goal" && (
        <section className="space-y-4">
          <h2 className="font-bold">{t("Targets")}</h2>
          {(definition.targets ?? []).map((target, index) => (
            <Row
              key={target.editorKey ?? index}
              index={index}
              count={definition.targets?.length ?? 0}
              onMove={(delta) => reorder("targets", index, delta)}
              onRemove={() => remove("targets", index)}
            >
              <Forms.TextInput field={`definition.targets.${index}.name`} label={t("Name")} />
              <Forms.FieldGroup layout="grid" layoutOptions={{ columns: 3 }}>
                <Forms.TextInput field={`definition.targets.${index}.unit`} label={t("Unit")} />
                <Forms.NumberInput field={`definition.targets.${index}.from`} label={t("Baseline")} />
                <Forms.NumberInput field={`definition.targets.${index}.to`} label={t("Target value")} />
              </Forms.FieldGroup>
            </Row>
          ))}
          <SecondaryButton type="button" size="sm" onClick={() => append("targets")} testId="add-template-target">
            {t("Add target")}
          </SecondaryButton>
        </section>
      )}
      {type === "project" && (
        <>
          <section className="space-y-4">
            <h2 className="font-bold">{t("Milestones")}</h2>
            <p className="text-sm text-content-subtle">
              {t("Removing a milestone keeps its tasks at the project level.")}
            </p>
            {(definition.milestones ?? []).map((milestone, index) => (
              <Row
                key={milestone.key}
                index={index}
                count={definition.milestones?.length ?? 0}
                onMove={(delta) => reorder("milestones", index, delta)}
                onRemove={() => remove("milestones", index)}
              >
                <Forms.TextInput field={`definition.milestones.${index}.title`} label={t("Title", { context: "resource" })} />
                <Forms.NumberInput
                  field={`definition.milestones.${index}.due_offset_days`}
                  label={t("Days after start")}
                />
              </Row>
            ))}
            <SecondaryButton
              type="button"
              size="sm"
              onClick={() => append("milestones")}
              testId="add-template-milestone"
            >
              {t("Add milestone")}
            </SecondaryButton>
          </section>
          <section className="space-y-4">
            <h2 className="font-bold">{t("Tasks")}</h2>
            {(definition.tasks ?? []).map((task, index) => (
              <Row
                key={task.key}
                index={index}
                count={definition.tasks?.length ?? 0}
                onMove={(delta) => reorder("tasks", index, delta)}
                onRemove={() => remove("tasks", index)}
              >
                <Forms.TextInput field={`definition.tasks.${index}.name`} label={t("Name")} />
                <Forms.RichTextArea
                  field={`definition.tasks.${index}.description`}
                  label={t("Description")}
                  richTextHandlers={richTextHandlers}
                />
                <Forms.SelectBox
                  field={`definition.tasks.${index}.milestone_key`}
                  label={t("Milestone")}
                  options={[
                    { value: "", label: t("Project level") },
                    ...(definition.milestones ?? []).map((m) => ({
                      value: m.key,
                      label: m.title || t("Untitled milestone"),
                    })),
                  ]}
                />
                <Forms.NumberInput field={`definition.tasks.${index}.due_offset_days`} label={t("Days after start")} />
              </Row>
            ))}
            <SecondaryButton type="button" size="sm" onClick={() => append("tasks")} testId="add-template-task">
              {t("Add task")}
            </SecondaryButton>
          </section>
        </>
      )}
    </>
  );
}

function Row({
  children,
  index,
  count,
  onMove,
  onRemove,
}: {
  children: React.ReactNode;
  index: number;
  count: number;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 rounded-lg border border-surface-outline p-4" data-test-id="template-child-row">
      {children}
      <div className="flex gap-2">
        <SecondaryButton type="button" size="xs" disabled={index === 0} onClick={() => onMove(-1)}>
          {t("Move up")}
        </SecondaryButton>
        <SecondaryButton type="button" size="xs" disabled={index === count - 1} onClick={() => onMove(1)}>
          {t("Move down")}
        </SecondaryButton>
        <SecondaryButton type="button" size="xs" onClick={onRemove}>
          {t("Remove")}
        </SecondaryButton>
      </div>
    </div>
  );
}
