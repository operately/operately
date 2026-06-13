import * as React from "react";

import { Link } from "../Link";
import { ContinueEditingDrafts, FileDragAndDropArea, NewFileModalsProvider, ResourceHubNodeRow } from "../ResourceHub";
import { SharedListContent } from "../ResourceHubPage/SharedListPage";
import { SectionHeader } from "../TaskPage/SectionHeader";
import { ProjectPage } from "./index";

export function DocsAndFilesTab({ docsAndFiles }: { docsAndFiles: ProjectPage.DocsAndFiles }) {
  return (
    <NewFileModalsProvider value={docsAndFiles.newFileModals}>
      <FileDragAndDropArea onFilesDropped={docsAndFiles.newFileModals.setFiles}>
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto my-6">
            <SharedListContent
              heading={docsAndFiles.resourceHub.name ?? "Documents & Files"}
              permissions={docsAndFiles.resourceHub.permissions}
              newFileModals={docsAndFiles.newFileModals}
              addFileWidgetProps={docsAndFiles.addFileWidgetProps}
              nodesListProps={docsAndFiles.nodesListProps}
              addFolderModalProps={docsAndFiles.addFolderModalProps}
              beforeList={
                <ContinueEditingDrafts
                  drafts={docsAndFiles.drafts.nodes}
                  draftsPath={docsAndFiles.drafts.draftsPath}
                  getDraftEditPath={docsAndFiles.drafts.getDraftEditPath}
                  getNodePath={docsAndFiles.nodesListProps.getNodePath}
                />
              }
            />
          </div>
        </div>
      </FileDragAndDropArea>
    </NewFileModalsProvider>
  );
}

export function DocsAndFilesPreview({ docsAndFiles }: { docsAndFiles: ProjectPage.DocsAndFiles }) {
  if (docsAndFiles.previewNodes.length === 0) {
    return (
      <div className="space-y-4" data-test-id="project-docs-and-files-preview">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader title="Docs & Files" />
          <Link to={docsAndFiles.tabPath} underline="hover" className="text-sm font-medium">
            Open docs & files
          </Link>
        </div>

        <div className="rounded-xl border border-surface-outline bg-surface-base px-4 py-5">
          <div className="text-sm font-medium text-content-accent">No documents or files yet</div>
          <div className="mt-1 text-sm text-content-dimmed">
            Open the full tab to add your first document, file, folder, or link.
          </div>
          <Link to={docsAndFiles.tabPath} underline="hover" className="mt-3 inline-flex text-sm font-medium">
            Open docs & files
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-test-id="project-docs-and-files-preview">
      <div className="flex items-center justify-between gap-3">
        <SectionHeader title="Docs & Files" />
        <Link to={docsAndFiles.tabPath} underline="hover" className="text-sm font-medium">
          Open docs & files
        </Link>
      </div>

      <div className="rounded-xl border border-surface-outline overflow-hidden bg-surface-base">
        {docsAndFiles.previewNodes.map((node, index) => (
          <ResourceHubNodeRow
            key={node.id ?? index}
            node={node}
            path={docsAndFiles.nodesListProps.getNodePath(node)}
            testId={`project-docs-and-files-preview-node-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
