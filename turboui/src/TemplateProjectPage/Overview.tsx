import React from "react";
import { PageDescription } from "../PageDescription";
import { RelativeDayField } from "../RelativeDayField";
import { StatusSelector } from "../StatusSelector";
import { MilestoneList } from "./MilestoneList";
import type { TemplateProjectPage } from ".";

export function Overview({ props, canEdit }: { props: TemplateProjectPage.Props; canEdit: boolean }) {
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
          <MilestoneList props={props} canEdit={canEdit} />
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
          <Workflow props={props} />
        </aside>
      </div>
    </div>
  );
}

function Workflow({ props }: { props: TemplateProjectPage.Props }) {
  return (
    <section data-test-id="template-workflow">
      <h2 className="mb-2 text-sm font-bold">Workflow</h2>
      <div className="flex flex-wrap gap-2">
        {props.statuses.map((status) => (
          <StatusSelector
            key={status.id}
            statusOptions={props.statuses}
            status={status}
            onChange={() => undefined}
            readonly
            showFullBadge
            size="sm"
          />
        ))}
      </div>
    </section>
  );
}
