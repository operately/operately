import React from "react";

import { GhostButton } from "../Button";
import { IconClipboardText } from "../icons";

const MAX_TEMPLATES = 7;

export namespace SpaceTemplatesTool {
  export interface Template {
    id: string;
    name: string;
    milestoneCount: number;
    taskCount: number;
  }

  export interface Props {
    templates: Template[];
    testId?: string;
  }
}

export function SpaceTemplatesTool({ templates, testId = "space-templates-tool" }: SpaceTemplatesTool.Props) {
  const content = templates.length === 0 ? <ZeroState /> : <RegularState templates={templates} />;

  return <div data-test-id={testId}>{content}</div>;
}

function ZeroState() {
  return (
    <div className="flex flex-col items-center justify-center h-full" data-test-id="space-templates-tool-empty">
      <TemplateExamples />

      <div className="flex flex-col items-center px-6 text-center">
        <div className="text-base font-bold">Templates</div>
        <div className="mt-1 mb-4 text-sm">Save reusable project structures for recurring work.</div>
        <GhostButton size="sm" spanButton>
          Create a template
        </GhostButton>
      </div>
    </div>
  );
}

function TemplateExamples() {
  return (
    <div className="flex flex-col gap-2 w-[220px] mt-12 mb-8 opacity-75">
      <TemplateExample name="Product launch" taskCount={12} />
      <TemplateExample name="Customer onboarding" taskCount={8} />
      <TemplateExample name="Hiring plan" taskCount={6} />
    </div>
  );
}

function TemplateExample({ name, taskCount }: { name: string; taskCount: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border rounded bg-surface-base border-stroke-base group-hover:border-accent-1 transition-colors">
      <IconClipboardText size={16} className="text-content-dimmed group-hover:text-accent-1 transition-colors" />
      <span className="font-bold text-xs truncate">{name}</span>
      <span className="ml-auto text-[11px] text-content-dimmed">{taskCount} tasks</span>
    </div>
  );
}

function RegularState({ templates }: Pick<SpaceTemplatesTool.Props, "templates">) {
  return (
    <div className="flex flex-col h-full">
      <div className="py-2 text-base font-bold text-center">Templates</div>

      <div className="flex-1 mx-2 overflow-hidden rounded bg-surface-dimmed">
        {templates.slice(0, MAX_TEMPLATES).map((template) => (
          <TemplateRow key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}

function TemplateRow({ template }: { template: SpaceTemplatesTool.Template }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-3 border-b border-stroke-base last:border-b-0"
      data-test-id={`space-template-row-${template.id}`}
    >
      <IconClipboardText size={16} className="flex-shrink-0 text-content-dimmed" />

      <div className="min-w-0">
        <div className="font-bold truncate">{template.name}</div>
        <div className="mt-0.5 text-content-dimmed">{formatCounts(template)}</div>
      </div>
    </div>
  );
}

function formatCounts(template: SpaceTemplatesTool.Template) {
  return `${pluralize(template.milestoneCount, "milestone")} · ${pluralize(template.taskCount, "task")}`;
}

function pluralize(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}
