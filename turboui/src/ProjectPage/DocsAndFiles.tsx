import * as React from "react";

import { ContinueEditingDrafts, FileDragAndDropArea, NewFileModalsProvider } from "../ResourceHub";
import { SharedListContent } from "../ResourceHubPage/SharedListPage";
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
