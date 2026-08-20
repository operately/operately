import React from "react";
import { DocsAndFilesPreview } from "../DocsAndFiles";
import { MilestoneList } from "../MilestoneList";
import { OverviewSidebar } from "./OverviewSidebar";
import { ProjectPage } from "./index";
import { PageDescription } from "../PageDescription";

export function Overview(props: ProjectPage.State) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 max-w-6xl mx-auto my-6">
        <div className="sm:grid sm:grid-cols-12 gap-8">
          <LeftColumn {...props} />
          <OverviewSidebar {...props} />
        </div>
      </div>
    </div>
  );
}

function LeftColumn(props: ProjectPage.State) {
  return (
    <div className="sm:col-span-8 space-y-8">
      <OverviewSection {...props} />
      <div className="pt-8 mt-8 border-t border-surface-outline">
        <MilestoneList
          variant="project"
          milestones={props.milestones || []}
          canEdit={props.permissions.canEdit || false}
          onMilestoneCreate={props.onMilestoneCreate}
          onMilestoneUpdate={props.onMilestoneUpdate}
          onMilestoneReorder={props.onMilestoneReorder}
        />
      </div>
      {props.docsAndFiles && (
        <div className="pt-8 mt-8 border-t border-surface-outline">
          <ResourcesSection {...props} />
        </div>
      )}
    </div>
  );
}

function OverviewSection(props: ProjectPage.State) {
  return (
    <div data-test-id="description-section">
      <PageDescription
        {...props}
        canEdit={props.permissions.canEdit}
        label="Description"
        placeholder="Add a project description..."
        zeroStatePlaceholder="Add a project description..."
        localDraftKey={props.localDraftKeyBase ? `${props.localDraftKeyBase}:description` : undefined}
      />
    </div>
  );
}

function ResourcesSection(props: ProjectPage.State) {
  if (!props.docsAndFiles) return null;

  return (
    <DocsAndFilesPreview
      nodes={props.docsAndFiles.previewNodes}
      tabPath={props.docsAndFiles.tabPath}
      getNodePath={props.docsAndFiles.nodesListProps.getNodePath}
    />
  );
}
